type Token =
  | { kind: "num"; value: number }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" | "^" | "(" | ")" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      const raw = expr.slice(i, j);
      const value = Number(raw);
      if (Number.isNaN(value)) {
        throw new Error(`Invalid number literal "${raw}"`);
      }
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j])) j++;
      tokens.push({ kind: "ident", value: expr.slice(i, j) });
      i = j;
      continue;
    }

    if ("+-*/^()".includes(ch)) {
      tokens.push({ kind: "op", value: ch as "+" | "-" | "*" | "/" | "^" | "(" | ")" });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${ch}" in expression`);
  }

  return tokens;
}

/**
 * Recursive-descent parser/evaluator for a restricted arithmetic grammar
 * (+ - * / ^ parens, numeric literals, and known variable names). Deliberately
 * not `eval`/`Function` — these formulas can originate from an LLM, and
 * we never want to hand that output to a real JS evaluator.
 */
export function evaluateFormula(
  expr: string,
  variables: Record<string, number>,
): number {
  const tokens = tokenize(expr);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() && peek().kind === "op" && (peek() as { value: string }).value in { "+": 1, "-": 1 }) {
      const op = consume() as { kind: "op"; value: "+" | "-" };
      const rhs = parseTerm();
      value = op.value === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parsePower();
    while (peek() && peek().kind === "op" && (peek() as { value: string }).value in { "*": 1, "/": 1 }) {
      const op = consume() as { kind: "op"; value: "*" | "/" };
      const rhs = parsePower();
      value = op.value === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek() && peek().kind === "op" && (peek() as { value: string }).value === "^") {
      consume();
      const exponent = parsePower();
      return Math.pow(base, exponent);
    }
    return base;
  }

  function parseUnary(): number {
    if (peek() && peek().kind === "op" && (peek() as { value: string }).value === "-") {
      consume();
      return -parseUnary();
    }
    return parseAtom();
  }

  function parseAtom(): number {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.kind === "num") {
      consume();
      return token.value;
    }

    if (token.kind === "ident") {
      consume();
      if (!(token.value in variables)) {
        throw new Error(`Unknown variable "${token.value}"`);
      }
      return variables[token.value];
    }

    if (token.kind === "op" && token.value === "(") {
      consume();
      const value = parseExpression();
      const close = consume();
      if (!close || close.kind !== "op" || close.value !== ")") {
        throw new Error("Expected closing parenthesis");
      }
      return value;
    }

    throw new Error(`Unexpected token in expression`);
  }

  const result = parseExpression();
  if (pos !== tokens.length) {
    throw new Error("Unexpected trailing input in expression");
  }
  return result;
}
