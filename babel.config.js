module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Transform import.meta for web compatibility
      function() {
        return {
          visitor: {
            MetaProperty(path, state) {
              // Only transform for web platform
              const platform = state.opts?.platform || process.env.EXPO_PLATFORM || 'web';
              if (platform !== 'web') {
                return;
              }

              const t = require('@babel/types');
              
              // Transform import.meta.url
              if (path.node.meta.name === 'import' && path.node.property.name === 'url') {
                // Replace with: (typeof document !== "undefined" ? (document.currentScript?.src || window.location.href) : "")
                const replacement = t.conditionalExpression(
                  t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('document')), t.stringLiteral('undefined')),
                  t.logicalExpression(
                    '||',
                    t.optionalMemberExpression(
                      t.memberExpression(t.identifier('document'), t.identifier('currentScript'), false),
                      t.identifier('src'),
                      false,
                      true
                    ),
                    t.memberExpression(
                      t.memberExpression(t.identifier('window'), t.identifier('location'), false),
                      t.identifier('href'),
                      false
                    )
                  ),
                  t.stringLiteral('')
                );
                path.replaceWith(replacement);
              }
              // Transform import.meta.resolve(path)
              else if (path.node.meta.name === 'import' && path.node.property.name === 'resolve') {
                // Replace with: ((path) => typeof window !== "undefined" ? new URL(path, window.location.href).href : path)
                const replacement = t.arrowFunctionExpression(
                  [t.identifier('path')],
                  t.conditionalExpression(
                    t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('window')), t.stringLiteral('undefined')),
                    t.memberExpression(
                      t.newExpression(
                        t.identifier('URL'),
                        [
                          t.identifier('path'),
                          t.memberExpression(
                            t.memberExpression(t.identifier('window'), t.identifier('location'), false),
                            t.identifier('href'),
                            false
                          )
                        ]
                      ),
                      t.identifier('href'),
                      false
                    ),
                    t.identifier('path')
                  )
                );
                path.replaceWith(replacement);
              }
            },
          },
        };
      },
    ],
  };
};
