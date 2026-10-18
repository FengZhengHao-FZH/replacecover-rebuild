// Verbatim from the shipped bundle (main.js:1:13956-14020):
//   B = function(e){ return Math.floor(Math.random() * (e - 1)) }
//
// The `- 1` is the original's own off-by-one and it is NOT corrected here, because
// correcting it changes observable behaviour. Call sites are:
//   names[B(names.length - 1)]  -> floor(rand * 33)  -> indices 0..32   (33,34 unreachable)
//   themes[B(themes.length)]    -> floor(rand * 14)  -> indices 0..13   (id 15 unreachable)
//   things[B(things.length)]    -> floor(rand * 60)  -> indices 0..59   (id 63 timer.png unreachable)
export const randomIndexBelow = (n) => Math.floor(Math.random() * (n - 1));
