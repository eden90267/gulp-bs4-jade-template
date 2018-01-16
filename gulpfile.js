const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync');
const autoprefixer = require('autoprefixer');
const minimist = require('minimist'); // 用來讀取指令轉成變數
const gulpSequence = require('gulp-sequence').use(gulp);

// production || development
// # gulp --env production
const envOptions = {
  string: 'env',
  default: {env: 'development'}
};
const options = minimist(process.argv.slice(2), envOptions);
console.log(options);

const srcPath = '/src',
      destPath = '/public';

gulp.task('clean', () => {
  return gulp.src([`.${destPath}`], {read: false}) // 選項讀取：false阻止gulp讀取文件的內容，使此任務更快。
      .pipe($.clean());
});

gulp.task('jade', () => {
  return gulp.src([`.${srcPath}/**/*.jade`])
      .pipe($.plumber())
      .pipe($.jade({pretty: true}))
      .pipe(gulp.dest(`.${destPath}`))
      .pipe(browserSync.reload({
        stream: true,
      }));
});

gulp.task('babel', function () {
  return gulp.src([`.${srcPath}/js/**/*.js`])
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.concat('all.js'))
      .pipe($.babel({
        presets: ['es2015']
      }))
      .pipe(
          $.if(options.env === 'production', $.uglify({
                compress: {
                  drop_console: true
                }
              })
          )
      )
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(`.${destPath}/js`))
      .pipe(browserSync.reload({
        stream: true
      }));
});

gulp.task('vendorJs', function () {
  return gulp.src([
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
      .pipe($.concat('vendor.js'))
      .pipe(gulp.dest(`.${destPath}/js`))
});

gulp.task('sass', function () {
  // PostCSS AutoPrefixer
  var processors = [
    autoprefixer({
      browsers: ['last 5 version'],
    })
  ];

  return gulp.src([`.${srcPath}/sass/**/*.sass`, `.${srcPath}/sass/**/*.scss`])
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass({
        outputStyle: 'nested',
        includePaths: ['./node_modules/bootstrap/scss']
      })
          .on('error', $.sass.logError))
      .pipe($.postcss(processors))
      .pipe($.if(options.env === 'production', $.minifyCss())) // 假設開發環境則壓縮 CSS
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(`.${destPath}/css`))
      .pipe(browserSync.reload({
        stream: true
      }));
});

gulp.task('imageMin', function () {
  gulp.src(`.${srcPath}/img/*`)
      .pipe($.if(options.env === 'production', $.imagemin()))
      .pipe(gulp.dest(`.${destPath}/img`));
});

gulp.task('browserSync', function () {
  browserSync.init({
    server: {baseDir: `.${destPath}`},
    reloadDebounce: 2000
  })
});

gulp.task('watch', function () {
  gulp.watch([`.${srcPath}/sass/**/*.sass`, `.${srcPath}/sass/**/*.scss`], ['sass']);
  gulp.watch([`.${srcPath}/**/*.jade`], ['jade']);
  gulp.watch([`.${srcPath}/js/**/*.js`], ['babel']);
});

gulp.task('deploy', function () {
  return gulp.src(`.${destPath}/**/*`)
      .pipe($.ghPages());
});

gulp.task('sequence', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs', 'imageMin'));

gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'browserSync', 'imageMin', 'watch']);
gulp.task('build', ['sequence']);