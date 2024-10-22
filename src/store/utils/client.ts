import react from "react";

export const isClient = typeof window !== "undefined";
export const { useRef, useState, useLayoutEffect } = react;
export const doc = document;
