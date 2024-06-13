
chrome.devtools.panels.create('x panel', 'icon.png', 'panel.html', () => {
  console.log('user switched to this panel');
});
