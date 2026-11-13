import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const toolName = String(input.toolName ?? input.name ?? input.tool ?? '').toLowerCase();
const toolInput = input.toolInput ?? input.input ?? input.arguments ?? {};
const serializedInput = JSON.stringify(toolInput).toLowerCase();

const deny = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
};

const isEnvPath = (value) => {
  const normalized = String(value).replaceAll('\\', '/');
  return /(^|\/)\.env(?:$|[.\/])/.test(normalized);
};

const isMigrationPath = (value) => {
  const normalized = String(value).replaceAll('\\', '/');
  return /(^|\/)backend\/migrations(?:\/|$)|(^|\/)migrations(?:\/|$)/.test(normalized);
};

const isCommandTool = /command|shell|terminal|exec|powershell|run/.test(toolName);
const isMutationTool = /edit|write|apply|patch|create|delete|remove|move|rename/.test(toolName);
const command = String(toolInput.command ?? toolInput.cmd ?? toolInput.script ?? '');
const isGitPush = /\bgit\s+push\b/i.test(command);
const touchesEnv = Object.values(toolInput).some((value) => isEnvPath(value))
  || serializedInput.includes('.env');
const touchesMigrations = (isMutationTool && (Object.values(toolInput).some((value) => isMigrationPath(value))
  || serializedInput.includes('/migrations/')
  || serializedInput.includes('\\migrations\\')))
  || (isCommandTool && /(?:>|>>|copy|move|remove-item|set-content|out-file|new-item|del|erase|rm|mv|cp|touch|edit|write|apply_patch).*(?:migrations|migration)/i.test(command));

if (touchesEnv) {
  deny('Accès aux fichiers .env* interdit par la politique du dépôt.');
} else if (isGitPush) {
  deny('La commande git push est interdite par la politique du dépôt.');
} else if (touchesMigrations) {
  deny('La modification du dossier migrations/ est interdite ; générez une migration avec Symfony.');
} else {
  process.stdout.write(JSON.stringify({ continue: true }));
}
