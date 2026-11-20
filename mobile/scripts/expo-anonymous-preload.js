const Module = require('module');

function installPromptsBypass() {
  try {
    const cliEntry = require.resolve('@expo/cli');
    const promptsPath = require.resolve('prompts', { paths: [cliEntry] });
    const originalPrompts = require(promptsPath);

    if (typeof originalPrompts !== 'function' || originalPrompts.__expoAnonymousPatched) {
      return;
    }

    const wrappedPrompts = async function wrappedPrompts(questions, options) {
      const list = Array.isArray(questions) ? questions : [questions];
      const loginPrompt = list.find(
        (q) =>
          q &&
          typeof q.message === 'string' &&
          q.message.includes('unverified-app-expo-go')
      );

      if (loginPrompt) {
        const answerName = loginPrompt.name || 'value';
        console.log(
          '\n[expo-launcher] Auto-selected "Proceed anonymously" so iOS Expo Go does not hang or time out waiting on terminal input.'
        );
        return { [answerName]: false };
      }

      return originalPrompts(questions, options);
    };

    Object.assign(wrappedPrompts, originalPrompts);
    wrappedPrompts.__expoAnonymousPatched = true;

    const cached = require.cache[promptsPath];
    if (cached) {
      cached.exports = wrappedPrompts;
    }

    const originalLoad = Module._load;
    Module._load = function patchedLoad(request, parent, isMain) {
      const loaded = originalLoad.apply(this, arguments);
      if (loaded === originalPrompts) {
        return wrappedPrompts;
      }
      return loaded;
    };
  } catch {
    // Ignore if @expo/cli or prompts cannot be resolved in non-Expo contexts
  }
}

function installProcessHandlers() {
  process.on('uncaughtException', (err) => {
    if (err && (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
      console.log(`[expo-launcher] Ignored transient socket error: ${err.code}`);
      return;
    }
    throw err;
  });
}

installPromptsBypass();
installProcessHandlers();
