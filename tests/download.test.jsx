import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/index.js';
import { copyChanged } from '../src/store/actions.js';

// Vitest does not process CSS, so the stylesheet copied from the shipped artifact is
// read as text: B21's textarea/paragraph swap lives in the cascade, not in JS.
const shippedCss = readFileSync(resolve(process.cwd(), 'src/styles/original.css'), 'utf8');

// B09 / B10 / B19 / B21 / B22 - the download chain: rasterise #canvasPreview with
// html2canvas, name the file after the playlist title, fire the GA event, and wrap the
// rasterise in body.hide-scrollbar.
//
// html2canvas is stubbed so each test decides when (and whether) the rasterise finishes;
// the shipped code removes the scrollbar class only inside .then(), so that timing is
// part of the contract. src/lib/device.js is mocked per test because isMobile is a
// module-load-time constant, exactly as in the original.
vi.mock('html2canvas', () => ({ default: vi.fn() }));

async function mount({ mobile = false, devicePixelRatio = 1 } = {}) {
  const store = createStore(rootReducer);

  vi.resetModules();
  vi.doMock('../src/lib/device.js', () => ({ isMobile: mobile }));

  const rasterise = (await import('html2canvas')).default;
  const analytics = (await import('../src/lib/analytics.js')).default;
  const { CanvasPreview } = await import('../src/components/CanvasPreview.jsx');
  const { DownloadTool } = await import('../src/components/DownloadTool.jsx');

  Object.defineProperty(window, 'devicePixelRatio', {
    value: devicePixelRatio,
    configurable: true,
  });

  const clicks = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    clicks.push({ download: this.download, href: this.href });
  });

  const toDataURL = vi.fn(() => 'data:image/jpeg;base64,RASTER');
  rasterise.mockReset();
  let resolveRasterise;
  rasterise.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRasterise = () => resolve({ toDataURL });
      }),
  );

  const eventSpy = vi.spyOn(analytics, 'event').mockImplementation(() => {});
  const pageviewSpy = vi.spyOn(analytics, 'pageview').mockImplementation(() => {});

  // The tool queries #canvasPreview from the document, so the raster target has to be
  // mounted with it, the way Home mounts both.
  const view = render(
    <Provider store={store}>
      <CanvasPreview />
      <DownloadTool />
    </Provider>,
  );

  const settle = () =>
    act(async () => {
      resolveRasterise();
      await Promise.resolve();
    });

  return {
    store,
    view,
    rasterise,
    toDataURL,
    eventSpy,
    pageviewSpy,
    clicks,
    settle,
    action: view.container.querySelector('[role=button][aria-label="Download Cover"]'),
    title: view.container.querySelector('textarea'),
    screenshot: view.container.querySelector('.c-canvasPreview--title-screenshot p'),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('../src/lib/device.js');
  document.body.className = '';
});

describe('B09 download rasterises #canvasPreview', () => {
  it('positive: clicking passes the raster target to html2canvas', async () => {
    const ctx = await mount();
    const target = ctx.view.container.querySelector('#canvasPreview');

    act(() => ctx.action.click());
    expect(ctx.rasterise).toHaveBeenCalledTimes(1);
    expect(ctx.rasterise.mock.calls[0][0]).toBe(target);

    await ctx.settle();
    expect(ctx.toDataURL).toHaveBeenCalledWith('image/jpeg', 1);
    expect(ctx.clicks).toHaveLength(1);
  });

  it('positive: the data url scheme is rewritten to octet-stream before the click', async () => {
    const ctx = await mount();
    act(() => ctx.action.click());
    await ctx.settle();
    expect(ctx.clicks[0].href).toBe('data:image/octet-stream;base64,RASTER');
  });

  it('negative: nothing rasterises until the action is activated', async () => {
    const ctx = await mount();
    expect(ctx.rasterise).not.toHaveBeenCalled();
    expect(document.body.classList.contains('hide-scrollbar')).toBe(false);

    act(() => ctx.store.dispatch(copyChanged({ playlistAuthor: 'This Is', playlistTitle: 'Typed' })));
    expect(ctx.rasterise).not.toHaveBeenCalled();
  });

  it('positive: keyboard activation reaches the same path as the click', async () => {
    const ctx = await mount();
    // React only synthesises keypress when the DOM event carries a charCode.
    act(() => fireEvent.keyPress(ctx.action, { key: 'Enter', charCode: 13 }));
    expect(ctx.rasterise).toHaveBeenCalledTimes(1);
  });
});

describe('B10 downloaded filename', () => {
  it('positive: the filename is the playlist title plus .jpeg', async () => {
    const ctx = await mount();
    act(() => ctx.action.click());
    await ctx.settle();
    expect(ctx.store.getState().activeCopy.playlistTitle).toBe('Unapologetically Replaceable');
    expect(ctx.clicks[0].download).toBe('Unapologetically Replaceable.jpeg');
  });

  it('positive: the filename follows the title as it changes', async () => {
    const ctx = await mount();
    act(() => ctx.store.dispatch(copyChanged({ playlistAuthor: 'This Is', playlistTitle: 'Late Night' })));
    act(() => ctx.action.click());
    await ctx.settle();
    expect(ctx.clicks[0].download).toBe('Late Night.jpeg');
  });

  it('negative: an emptied title still produces an extension', async () => {
    const ctx = await mount();
    act(() => ctx.store.dispatch(copyChanged({ playlistAuthor: 'This Is', playlistTitle: '' })));
    act(() => ctx.action.click());
    await ctx.settle();
    expect(ctx.clicks[0].download).toBe('.jpeg');
  });
});

describe('B19 download emits a GA event', () => {
  it('positive: the event carries the Covers category and the current title', async () => {
    const ctx = await mount();
    act(() => ctx.store.dispatch(copyChanged({ playlistAuthor: 'This Is', playlistTitle: 'Deep Focus' })));
    act(() => ctx.action.click());
    expect(ctx.eventSpy).toHaveBeenCalledWith({
      category: 'Covers',
      action: 'Downloaded A Cover',
      label: 'Deep Focus',
    });
  });

  it('positive: the event fires while the rasterise is still pending', async () => {
    const ctx = await mount();
    act(() => ctx.action.click());
    expect(ctx.eventSpy).toHaveBeenCalledTimes(1);
    expect(ctx.toDataURL).not.toHaveBeenCalled();
  });

  it('negative: downloading is not a pageview', async () => {
    const ctx = await mount();
    act(() => ctx.action.click());
    expect(ctx.pageviewSpy).not.toHaveBeenCalled();
    expect(ctx.eventSpy).toHaveBeenCalledTimes(1);
  });
});

describe('B21 body.hide-scrollbar brackets the rasterise', () => {
  it('positive: the class is on while the canvas is being built', async () => {
    const ctx = await mount();
    act(() => ctx.action.click());
    expect(document.body.classList.contains('hide-scrollbar')).toBe(true);
    await ctx.settle();
    expect(document.body.classList.contains('hide-scrollbar')).toBe(false);
  });

  it('positive: the swap it triggers is CSS-driven, textarea out and paragraph in', () => {
    expect(shippedCss).toContain('.hide-scrollbar .c-canvasPreview--title{display:none}');
    expect(shippedCss).toContain('.hide-scrollbar .c-canvasPreview--title-screenshot{display:block}');
    expect(shippedCss).toContain('.c-canvasPreview--title-screenshot{display:none');
  });

  it('positive: both title nodes exist so the class can choose between them', async () => {
    const ctx = await mount();
    expect(ctx.title).not.toBeNull();
    expect(ctx.screenshot.textContent).toBe(ctx.store.getState().activeCopy.playlistTitle);

    act(() => ctx.store.dispatch(copyChanged({ playlistAuthor: 'This Is', playlistTitle: 'Mirror Me' })));
    expect(ctx.view.container.querySelector('.c-canvasPreview--title-screenshot p').textContent).toBe(
      'Mirror Me',
    );
  });

  it('negative: the class only comes back from inside the resolution handler', async () => {
    const ctx = await mount();
    // The shipped download() has no catch()/finally(), so until html2canvas resolves the
    // body keeps hide-scrollbar - a rasterise that never settles never restores it.
    let later;
    ctx.rasterise.mockImplementation(() => new Promise((resolve) => (later = resolve)));
    act(() => ctx.action.click());
    expect(document.body.classList.contains('hide-scrollbar')).toBe(true);
    await Promise.resolve();
    expect(document.body.classList.contains('hide-scrollbar')).toBe(true);

    await act(async () => {
      later({ toDataURL: ctx.toDataURL });
      await Promise.resolve();
    });
    expect(document.body.classList.contains('hide-scrollbar')).toBe(false);
  });
});

describe('B22 raster scale', () => {
  it('positive: desktop rasterises at scale 1', async () => {
    const ctx = await mount({ devicePixelRatio: 3 });
    act(() => ctx.action.click());
    expect(ctx.rasterise.mock.calls[0][1]).toEqual({ width: 0, height: 0, scale: 1 });
    expect(ctx.title.style.fontSize).toBe('60px');
  });

  it('positive: mobile rasterises at devicePixelRatio and halves the canvas text', async () => {
    const ctx = await mount({ mobile: true, devicePixelRatio: 3 });
    act(() => ctx.action.click());
    expect(ctx.rasterise.mock.calls[0][1]).toEqual({ width: 0, height: 0, scale: 3 });
    expect(ctx.title.style.fontSize).toBe('30px');
  });

  it('negative: the scale tracks the device, not the theme or the text size', async () => {
    const ctx = await mount({ mobile: false, devicePixelRatio: 2 });
    act(() => ctx.store.dispatch({ type: 'TEXT_SIZE_CHANGED', payload: { size: 44 } }));
    act(() => ctx.action.click());
    expect(ctx.rasterise.mock.calls[0][1].scale).toBe(1);
    expect(ctx.title.style.fontSize).toBe('44px');
  });
});
