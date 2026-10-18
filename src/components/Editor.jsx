import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { ThingsGrid } from './ThingsGrid.jsx';
import { ThemesGrid } from './ThemesGrid.jsx';

// main.js:1:13490-13960 (`j`). react-tabs is used rather than a hand-rolled tab strip
// because the shipped stylesheet targets its generated class names
// (react-tabs__tab-list / __tab / __tab-panel--selected), and because only the selected
// panel mounts - the captured DOM shows the second panel as an empty div.
export function Editor() {
  return (
    <div className="s-editor">
      <div className="s-editorContainer">
        <Tabs>
          <TabList>
            <Tab><span className="text-gray-200">Things</span></Tab>
            <Tab><span className="text-gray-200">Themes</span></Tab>
          </TabList>
          <TabPanel><ThingsGrid /></TabPanel>
          <TabPanel><ThemesGrid /></TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

export default Editor;
