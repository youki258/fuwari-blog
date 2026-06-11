---
title: "React 事件处理与渲染原理"
published: 2026-04-08
updated: 2026-04-08
description: "函数引用与调用的区别、setState 副作用、防止无限重渲染"
tags: ["React","JavaScript","事件处理","前端"]
category: "技术随笔"
draft: true
---

1) 函数“引用”和“调用”的差别（JS 基础）  
- 引用：`onClick={handleClick}` —— 把函数本身传下去，点击时才执行。  
- 调用：`onClick={handleClick()}` —— 在当前代码执行时立即运行 `handleClick`，并把返回值（不是函数）作为 prop 传入。  

2) React 渲染阶段的原则  
- 渲染（render）阶段应尽量“纯”（不做副作用）。  
- `setState`（例如 `setSquares`）是副作用：调用它会触发一次重新渲染。  
- 如果在渲染期间直接调用了会触发 `setState` 的函数，就会导致渲染→调用 setState→再次渲染→再次调用 的循环。

3) 你代码中为什么“太早运行”或出现循环  
- 你在 JSX 中写 `onSquareClick={handleClick(0)}`，这会在渲染时立即执行 `handleClick(0)`。  
- `handleClick(0)` 内又做了 `setSquares(...)`，触发重新渲染，渲染又会再次执行 `handleClick(0)` —— 就是无限循环或“太早执行”的原因。

4) 正确的修复方法（两种常见写法）  
- 直接传函数引用（包装参数）：
  
> 这里，`() => handleClick(0)` 是一个箭头函数，它是定义函数的一种较短的方式。单击方块时，`=>`“箭头”之后的代码将运行，调用 `handleClick(0)`。
  
  - Inline wrapper: `onSquareClick={() => handleClick(0)}`（渲染时只创建函数，不调用；点击时执行）  
  - 预先定义 wrapper 再传：  
    ```javascript
    const handleFirstSquareClick = () => handleClick(0);
    <Square onSquareClick={handleFirstSquareClick} />
    ```

6) 修正示例（可直接替换 App.js 相关部分）
```javascript
function Square({ value, onSquareClick }) {
  return <button className="square" onClick={onSquareClick}>{value}</button>;
}

export default function Board() {
  const [squares, setSquares] = useState(Array(9).fill(null));

  function handleClick(i) {
    const nextSquares = squares.slice();
    nextSquares[i] = 'X';
    setSquares(nextSquares);
  }

  return (
    <>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      ...
    </>
  );
}
```
