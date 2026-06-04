const url = 'https://attendanceqrble.web.app/?t=8ca13c27c02250d6';
fetch(url).then(res => res.text()).then(text => {
  const start = text.indexOf('<script type="module">');
  console.log(text.substring(start));
}).catch(console.error);
