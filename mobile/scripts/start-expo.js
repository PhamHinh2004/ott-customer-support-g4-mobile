const os = require('os');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const VIRTUAL_INTERFACE_PATTERN = /(vethernet|wsl|hyper-v|vmware|vmnet|virtualbox|vbox|docker|loopback|bluetooth|tailscale|zerotier|hamachi|radmin|npcap|tunnel|teredo|isatap)/i;
const VIRTUAL_MAC_PREFIXES = ['00:15:5d', '00:50:56', '00:05:69', '00:0c:29', '08:00:27', '0a:00:27'];

function isVirtualInterface(name, info) {
  if (info.internal) return true;
  if (VIRTUAL_INTERFACE_PATTERN.test(name)) return true;
  if (info.address.startsWith('169.254.')) return true;
  const mac = (info.mac || '').toLowerCase();
  if (!mac || mac === '00:00:00:00:00:00') return true;
  return VIRTUAL_MAC_PREFIXES.some((prefix) => mac.startsWith(prefix));
}

function scoreInterface(name, address) {
  let score = 0;
  if (/^(wi-?fi|wlan|wireless)/i.test(name)) score += 100;
  else if (/^(ethernet|en\d|eth\d)/i.test(name)) score += 60;

  if (address.startsWith('192.168.')) score += 30;
  else if (address.startsWith('10.')) score += 20;
  else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) score += 10;

  return score;
}

function detectPhysicalLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const info of addrs) {
      if (info.family !== 'IPv4') continue;
      if (isVirtualInterface(name, info)) continue;
      candidates.push({
        name,
        address: info.address,
        score: scoreInterface(name, info.address),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

function readEnvApiHost(projectRoot) {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^EXPO_PUBLIC_API_URL=https?:\/\/([^:/\r\n]+)/m);
  return match ? match[1] : null;
}

function hasHostFlag(args, targetHost) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === `--${targetHost}`) return true;
    if ((arg === '--host' || arg === '-m') && args[i + 1] === targetHost) return true;
    if (arg.startsWith('--host=') && arg.slice('--host='.length) === targetHost) return true;
  }
  return false;
}

function normalizeTunnelArgs(args) {
  const normalized = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    normalized.push(arg);
    if (arg === '--tunnel') {
      const next = args[i + 1];
      if (!next || next.startsWith('-')) {
        normalized.push('ngrok');
      }
    }
  }
  return normalized;
}

function getRequestedPort(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if ((arg === '--port' || arg === '-p') && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    if (arg.startsWith('--port=')) {
      const parsed = Number(arg.slice('--port='.length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return 8081;
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(err && err.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const rawArgs = process.argv.slice(2);
  const expoArgs = normalizeTunnelArgs(rawArgs);
  const isTunnelMode = expoArgs.includes('--tunnel') || hasHostFlag(expoArgs, 'tunnel');
  const isLocalhostMode = hasHostFlag(expoArgs, 'localhost');
  const port = getRequestedPort(expoArgs);

  const env = { ...process.env };
  const detected = detectPhysicalLanIp();

  if (!isTunnelMode && !isLocalhostMode && !env.REACT_NATIVE_PACKAGER_HOSTNAME && detected) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = detected.address;
    console.log(`[expo-launcher] Using physical ${detected.name} IPv4: ${detected.address}`);
  }

  const envApiHost = readEnvApiHost(projectRoot);
  if (detected && envApiHost && envApiHost !== detected.address && envApiHost !== 'localhost' && envApiHost !== '127.0.0.1') {
    console.log(
      `[expo-launcher] Warning: mobile/.env EXPO_PUBLIC_API_URL points to ${envApiHost}, while this PC's Wi-Fi IP is ${detected.address}. If your backend runs on this PC, update mobile/.env accordingly.`
    );
  }

  if (await isPortInUse(port)) {
    console.log(
      `[expo-launcher] Warning: Port ${port} is already in use. Close the previous Expo/Metro terminal first (Ctrl+C), especially in tunnel mode to avoid ngrok conflicts.`
    );
  }

  if (!isTunnelMode) {
    console.log('[expo-launcher] Tip: If iOS Expo Go still times out on LAN (Windows Firewall/Public Wi-Fi/AP Isolation), run: npm run start:tunnel');
  }

  const preloadPath = path.join(__dirname, 'expo-anonymous-preload.js');
  const expoBin = require.resolve('expo/bin/cli', { paths: [projectRoot] });
  const child = spawn(process.execPath, ['-r', preloadPath, expoBin, 'start', ...expoArgs], {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

main();
