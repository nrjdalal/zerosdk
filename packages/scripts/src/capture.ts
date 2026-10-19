// Runs a command and returns its stdout, failing with its stderr (or stdout) and exit status when it exits non-zero; stdin, when given, is piped in.
export const capture = async (cmd: string[], cwd: string, stdin?: string): Promise<string> => {
  const proc = Bun.spawn(cmd, {
    cwd,
    stderr: "pipe",
    stdin: stdin === undefined ? "ignore" : new Blob([stdin]),
    stdout: "pipe",
  })
  const [out, err, status] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (status !== 0) throw new Error(`${cmd.join(" ")} failed (${status}):\n${err || out}`)
  return out
}
