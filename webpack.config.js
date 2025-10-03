import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import packageInfo from './package.json' with { type: 'json' };

const { DefinePlugin } = webpack;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env = {}) => {
  const isProduction = !!env.production;

  class CopyFloorplanToRootPlugin {
    constructor({ filename, destinationDir }) {
      this.filename = filename;
      this.destinationDir = destinationDir;
    }

    apply(compiler) {
      compiler.hooks.afterEmit.tapPromise(
        'CopyFloorplanToRootPlugin',
        async (compilation) => {
          const outputPath = compiler.options.output?.path;

          if (!outputPath) {
            compilation.warnings.push(
              new Error('CopyFloorplanToRootPlugin: Unable to resolve output path.')
            );
            return;
          }

          const sourcePath = path.resolve(outputPath, this.filename);
          const destinationPath = path.resolve(this.destinationDir, this.filename);

          try {
            await fs.copyFile(sourcePath, destinationPath);
          } catch (error) {
            compilation.warnings.push(
              new Error(
                `CopyFloorplanToRootPlugin: Failed to copy ${this.filename} to project root. ${error.message}`
              )
            );
          }
        }
      );
    }
  }

  const plugins = isProduction
    ? [
        // Keep distribution simple for HA: only produce floorplan.js
        new CopyFloorplanToRootPlugin({
          filename: 'floorplan.js',
          destinationDir: __dirname,
        }),
      ]
    : [];

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      floorplan: './src/index.ts',
    },
    devtool: isProduction ? undefined : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      mainFields: ['browser', 'module', 'main'], // Ensure ES Modules are prioritized
    },
    plugins: [
      new DefinePlugin({
        NAME: JSON.stringify(packageInfo.name),
        DESCRIPTION: JSON.stringify(packageInfo.description),
        VERSION: JSON.stringify(packageInfo.version),
      }),
      ...plugins,
    ],
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, isProduction ? 'dist' : 'dist_local'),
      clean: true,
      libraryTarget: 'module', // Use ES Module output
    },
    experiments: {
      outputModule: true, // Enable ES Module output
    },
    optimization: {
      minimize: isProduction,
      minimizer: isProduction
        ? [
            new TerserPlugin({
              extractComments: false,
            }),
          ]
        : [],
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'docs/_docs/floorplan'),
      },
      compress: true,
    },
  };
};
