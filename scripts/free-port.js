const { execSync } = require('child_process');

const port = String(process.env.PORT || 3000);

function collectWindowsListenerPids(output) {
  const pids = new Set();

  output.split('\n').forEach((line) => {
    if (!line.includes('LISTENING') || !line.includes(`:${port}`)) {
      return;
    }

    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];

    if (pid && pid !== '0') {
      pids.add(pid);
    }
  });

  return pids;
}

function freePort() {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = collectWindowsListenerPids(output);

      pids.forEach((pid) => {
        if (String(pid) === String(process.pid)) {
          return;
        }

        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Freed port ${port} (stopped PID ${pid})`);
      });

      return;
    }

    execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: 'ignore' });
    console.log(`Freed port ${port}`);
  } catch {
    // Port is already free or no matching listener was found.
  }
}

if (require.main === module) {
  freePort();
}

module.exports = { freePort, port };
