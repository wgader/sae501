import path from "node:path";

const quote = (file) => `"${file}"`;

const toBackendPath = (file) => {
  const relativePath = path
    .relative(process.cwd(), path.resolve(file))
    .replaceAll(path.sep, "/");

  return relativePath.startsWith("backend/")
    ? relativePath.slice("backend/".length)
    : relativePath;
};

export default {
  "frontend/**/*.{js,jsx,mjs,cjs,ts,tsx}": (files) =>
    `npm --prefix frontend run lint -- --fix ${files
      .map((file) => quote(path.resolve(file)))
      .join(" ")}`,
  "backend/**/*.php": (files) =>
    `docker compose exec -T backend php vendor/bin/php-cs-fixer fix --config=.php-cs-fixer.dist.php --path-mode=intersection ${files
      .map((file) => quote(toBackendPath(file)))
      .join(" ")}`,
};
