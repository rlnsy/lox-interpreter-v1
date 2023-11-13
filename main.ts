import { lox } from "./lox";

await __bun_run__();

async function __bun_run__() {
  // bun execution boilerplate
  // bun-run lox.ts <args>
  const [_1, _2, ...args] = process.argv;
  await lox.main(args);
}
