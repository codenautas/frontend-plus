const path = require('path');
module.exports = {
    devtool:'source-map',
    mode: 'development',
    entry: {
        "frontend-plus": './src/lib/frontend-plus.tsx',
        //unlogged:'./dist/unlogged/unlogged.js',
    },
    output: {
        filename: 'lib/[name]-bundle.js',
        path: path.resolve(__dirname, 'dist'),
        //libraryTarget: 'umd', // Formato de salida UMD
        //library: 'frontend-plus-bundle', // Nombre de tu librería (importante para UMD)
        //globalObject: 'this', // Necesario para UMD en el navegador
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'], // Importante: incluye .tsx y .ts
    },
    module: {
        rules: [{
            test: /\.(ts|tsx)$/, // Archivos TypeScript
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env', '@babel/preset-react', "@babel/preset-typescript"]
                }
            },
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
              loader: 'babel-loader',
              options: {
                  presets: ['@babel/preset-env', '@babel/preset-react']
              }
          }
        }]
    },
    externals: {
        //no incluir en el bundle (agregar a proyecto final)
        //react: 'react', 
        //'react-dom': 'react-dom',
        //'@mui/material': '@mui/material',
    },
};