const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const child_process = require('child_process');

const AMP_GIT_URL = 'https://github.com/ampproject/amphtml.git';
const GIT_URL = 'https://github.com/tanhauhau/amp-viewer.git';

(async function() {
  const cacheFolder = __dirname; //path.join(require('os').homedir(), '.cache/amp-viewer');
  const ampCacheFolder = path.join(cacheFolder, './amphtml');
  const viewerCacheFolder = path.join(cacheFolder, './master');

  if (!(await fs.exists(ampCacheFolder))) {
    await fs.mkdirp(ampCacheFolder);
    await exec(
      `git clone ${AMP_GIT_URL} ${ampCacheFolder} --branch master --single-branch --origin origin --depth 1`,
      ampCacheFolder
    );
  } else {
    await exec('git fetch origin master', ampCacheFolder);
    await exec('git merge origin/master', ampCacheFolder);
  }

  if (!(await fs.exists(viewerCacheFolder))) {
    await fs.mkdirp(viewerCacheFolder);
    await exec(
      `git clone ${GIT_URL} ${viewerCacheFolder} --branch master --single-branch --origin origin --depth 1`,
      viewerCacheFolder
    );
  } else {
    await exec('git fetch origin master', viewerCacheFolder);
    await exec('git merge origin/master', viewerCacheFolder);
  }

  await exec('yarn install', ampCacheFolder);
  await exec('npx gulp build', ampCacheFolder);

  const from = path.join(
    ampCacheFolder,
    './dist/v0/examples/amp-viewer-host.max.js'
  );
  const to = path.join(viewerCacheFolder, './amp-viewer-host.max.js');

  console.log(chalk.dim(`copy from ${from} to ${to}`));
  await fs.copy(from, to);

  await exec('git add .', viewerCacheFolder);
  await exec(
    `git commit -m "Built on ${String(new Date())}"`,
    viewerCacheFolder
  );
  await exec('git push origin master', viewerCacheFolder);

  function exec(cmd, cwd) {
    console.log(path.basename(cwd) + ':', chalk.dim(cmd));
    child_process.execSync(cmd, { cwd, stdio: 'inherit' });
  }
})();
