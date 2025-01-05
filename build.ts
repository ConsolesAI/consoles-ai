import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import arg from 'arg';
import { build, context, BuildOptions, Plugin } from 'esbuild';
import * as glob from 'glob';

const args = arg({
  '--watch': Boolean,
  '--force': Boolean,
});

const isWatch = args['--watch'] || false;
const isForce = args['--force'] || false;

function removeDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  if (!isForce) {
    const stat = fs.statSync(dirPath);
    if (stat.isDirectory() && fs.readdirSync(dirPath).length > 0) {
      console.warn(`Warning: ${dirPath} is not empty. Use --force to overwrite.`);
      return;
    }
  }

  fs.readdirSync(dirPath).forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      removeDir(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
  fs.rmdirSync(dirPath);
}

const entryPoints = glob.sync('./src/**/*.ts', {
  ignore: ['./src/**/*.test.ts', './src/mod.ts', './src/middleware.ts', './src/deno/**/*.ts'],
});

const addExtension = (extension: string = '.js', fileExtension: string = '.ts'): Plugin => ({
  name: 'add-extension',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.importer) {
        const p = path.join(args.resolveDir, args.path);
        let tsPath = `${p}${fileExtension}`;

        let importPath = '';
        if (fs.existsSync(tsPath)) {
          importPath = args.path + extension;
        } else {
          tsPath = path.join(args.resolveDir, args.path, `index${fileExtension}`);
          if (fs.existsSync(tsPath)) {
            importPath = `${args.path}/index${extension}`;
          }
        }
        return { path: importPath, external: true };
      }
    });
  },
});

const commonOptions: BuildOptions = {
  entryPoints,
  logLevel: 'info',
  platform: 'node',
};

const cjsBuild = async () => {
  const buildOptions: BuildOptions = {
    ...commonOptions,
    outbase: './src',
    outdir: './dist/cjs',
    format: 'cjs',
  };

  if (isWatch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
  } else {
    await build(buildOptions);
  }
};

const esmBuild = async () => {
  const buildOptions: BuildOptions = {
    ...commonOptions,
    bundle: true,
    outbase: './src',
    outdir: './dist',
    format: 'esm',
    plugins: [addExtension('.js')],
  };

  if (isWatch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
  } else {
    await build(buildOptions);
  }
};

removeDir('./dist');
// Generate type declarations first
exec(`tsc ${isWatch ? '-w' : ''} --project tsconfig.build.json`, (error, stdout, stderr) => {
  if (error) {
    console.error(`TypeScript compilation failed:`);
    console.error(stdout);
    console.error(stderr);
    return;
  }

  // Then build the JavaScript code
  Promise.all([esmBuild(), cjsBuild()]);
});