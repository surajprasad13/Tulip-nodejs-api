module.exports = {
    default: [
        '--require-module ts-node/register',
        `--format-options '{"snippetInterface": "synchronous"}'`,
        '--require features/**/*.ts',
        '--publish-quiet'
    ].join(' ')
}