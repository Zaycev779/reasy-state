import react from "react";

export const isClient = typeof window !== "undefined" && window;
export const { useRef, useState, useLayoutEffect } = react;
