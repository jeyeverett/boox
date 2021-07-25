var sass = require('sass');
const fs = require('fs');

var result = sass.renderSync({ file: 'sass/main.scss' });

fs.writeFile('public/stylesheets/style.css', result.css, (err) => {
  if (err) console.log(err);
});
