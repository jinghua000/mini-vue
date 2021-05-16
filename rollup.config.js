import typescript from 'rollup-plugin-typescript2'
import livereload from 'rollup-plugin-livereload'
import serve from 'rollup-plugin-serve'

export default {
    input: 'src/index.ts',
    plugins: [
        typescript(),
        serve(),
        livereload()
    ],
    output: [
        {
            name: 'Vue',
            file: 'dist/mini-vue.umd.js',
            format: 'umd'
        },
    ],
}