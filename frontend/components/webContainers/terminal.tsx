"use client"

import { Terminal } from "@xterm/xterm"

let terminal : Terminal = new Terminal();

export function setTerminal(instance: Terminal) {
    terminal = instance;
}

export function getTerminal() {
    return terminal;
}