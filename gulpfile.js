const { series } = require('gulp');

let gulp = require('gulp'),
    sass = require('gulp-sass')(require('sass')),
    browserSync = require('browser-sync'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'), 
    rename = require('gulp-rename'),
    del = require('del'), 
    autoprefixer = require('gulp-autoprefixer'),
    svgSprite = require('gulp-svg-sprite'),
    plumber = require('gulp-plumber'),
    svgmin = require('gulp-svgmin'),
	cheerio = require('gulp-cheerio'),
	replace = require('gulp-replace'),
    pug = require('gulp-pug'),
    spritesmith  = require('gulp.spritesmith'),
    buffer = require('vinyl-buffer'),
    imagemin = require('gulp-imagemin'),
    merge        = require('merge-stream');

gulp.task('cleanSprites', function(){
    return del(['app/assets/icons/sprite.svg', 'app/assets/icons/sprite.png', 'app/assets/icons/sprite@2x.png']);
});

gulp.task('svgSprite', function () {
    return gulp.src('app/assets/icons/*.svg')
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../../sprites/sprite.svg",
                }
            }
        }))
        .pipe(gulp.dest('app/assets/icons/'));
});

gulp.task('pngSprite', function () {
    const pngSpriteData = gulp.src('app/assets/icons-png/*.*')
    .pipe(spritesmith({
        cssOpts: {
            cssSelector: function (sprite) {
              return '.picon-' + sprite.name;
            }
        },
        imgName: 'sprite.png',
        imgPath: '../../sprites/sprite.png',
        cssName: '_sprite.scss',
        retinaSrcFilter: 'app/assets/icons-png/*@2x.png',
        retinaImgName: 'sprite@2x.png',
        retinaImgPath: '../../sprites/sprite@2x.png',
        padding: 5,
    }));
    
    // Pipe image stream onto disk
    const imgStream = pngSpriteData.img
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(gulp.dest('app/assets/sprites/'));
    
    // Pipe CSS stream onto disk
    const cssStream = pngSpriteData.css
        .pipe(gulp.dest('app/assets/scss/mixins'));
    
    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});
 
gulp.task('scss', function(){
    return gulp.src('app/assets/scss/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 8 versions']
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/assets/css'))
        .pipe(browserSync.reload({stream: true}))
});

gulp.task('css', function(){
    return gulp.src([
        'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.css',
        'node_modules/select2/dist/css/select2.min.css',
        'node_modules/swiper/swiper-bundle.min.css',
        'node_modules/ion-rangeslider/css/ion.rangeSlider.min.css',

        'node_modules/air-datepicker/dist/css/datepicker.css',

        'node_modules/normalize.css/normalize.css',
    ])
        .pipe(concat('libs.scss'))
        .pipe(gulp.dest('app/assets/scss'))
        .pipe(browserSync.reload({stream: true}))
});

gulp.task('pug', function(){
    return gulp.src('app/*.pug')
        .pipe(
            pug({
                pretty: true,
            })
        )
        .pipe(gulp.dest('app/'))
});

gulp.task('pugReload', function(){
    return gulp.src('app/**/*.pug')
        .pipe(browserSync.reload({stream: true}))
});

// gulp.task('html', function(){
//     return gulp.src('app/*.html')
//         .pipe(browserSync.reload({stream: true}))
// });

gulp.task('script', function(){
    return gulp.src('app/assets/js/*.js')
        .pipe(browserSync.reload({stream: true}))
});

gulp.task('js', function(){
    return gulp.src([
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/swiper/swiper-bundle.min.js',
        'node_modules/select2/dist/js/select2.full.min.js',
        'node_modules/ion-rangeslider/js/ion.rangeSlider.min.js',
        'node_modules/air-datepicker/dist/js/datepicker.min.js',
        'node_modules/jquery-mask-plugin/dist/jquery.mask.min.js',
        'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.js',
    ])
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/assets/js'))
        .pipe(browserSync.reload({stream: true}))
});

gulp.task('watch', function(){
    gulp.watch('app/assets/scss/**/*.scss', gulp.parallel('scss'));
    gulp.watch('app/**/*.pug', gulp.parallel('pug'));
    gulp.watch('app/**/*.pug', gulp.parallel('pugReload'));
    gulp.watch('app/assets/js/**/*.js', gulp.parallel('script'));
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "app/"
        }
    });
});

gulp.task('export', async function(){
    let buildHtml = gulp.src('app/**/*.html')
        .pipe(gulp.dest('dist'));

    let buildCss = gulp.src('app/css/**/*.css')
        .pipe(gulp.dest('dist/assets/css'));

    let buildJs = gulp.src('app/js/**/*.js')
        .pipe(gulp.dest('dist/assets/js'));

    let buildFonts = gulp.src('app/fonts/**/*.')
        .pipe(gulp.dest('dist/assets/fonts'))

    let buildImages = gulp.src('app/images/**/*.')
        .pipe(gulp.dest('dist/temp/images'))
});

gulp.task('clean', async function(){
    del.sync('dist')
});

gulp.task('build', gulp.series('clean', 'export'));

gulp.task('default', gulp.parallel('pug', 'css', 'scss', 'js', 'browser-sync', 'watch'));