import {
  CompleteResult,
  ExtensionContext,
  sources,
  workspace,
  VimCompleteItem,
  CompleteOption,
} from "coc.nvim";

import { Candidate } from "./types";

const delay = (delay: number) => new Promise((res) => setTimeout(res, delay));

export async function activate(context: ExtensionContext): Promise<void> {
  workspace.showMessage(`coc-comrade connected!`);

  context.subscriptions.push(
    sources.createSource({
      name: "coc-comrade completion source", // unique id
      shortcut: "IntelliJ", // [CS] is custom source
      priority: 99,
      triggerCharacters: ["."],
      filetypes: ["java", "kotlin"],
      duplicate: true,
      doComplete: async function () {
        const buffer = await workspace.nvim.buffer;
        const bufferId = buffer.id;
        const bufferName = await buffer.name;
        const window = await workspace.nvim.window;
        const [row, col] = await window.cursor;
        const changedTick = await workspace.nvim.eval(
          `nvim_buf_get_changedtick(${bufferId})`
        );

        const ret = {
          buf_id: buffer.id,
          buf_name: bufferName,
          buf_changedtick: changedTick,
          row: row - 1,
          col: col - 1,
          new_request: true,
        };

        let results = await workspace.nvim.call("comrade#RequestCompletion", [
          buffer.id,
          ret,
        ]);

        while (
          typeof results.is_finished == "boolean" &&
          !results.is_finished
        ) {
          await delay(1500);
          results = await workspace.nvim.call("comrade#RequestCompletion", [
            buffer.id,
            {
              ...ret,
              new_request: false,
            },
          ]);
        }

        return {
          items: results.candidates.map((candidate: Candidate) => ({
            ...candidate,
            menu: (this as any).menu,
          })),
        } as CompleteResult;
      },
      // onCompleteDone: async function (
      // item: VimCompleteItem,
      // opt: CompleteOption
      // ) {
      // workspace.showMessage(JSON.stringify(item));
      // workspace.showMessage(JSON.stringify(opt));
      // workspace.showMessage("completion done called");
      // },
    })
  );
}
