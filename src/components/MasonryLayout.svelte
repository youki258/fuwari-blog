<script lang="ts">
import { onMount } from "svelte";

let { children }: { children: any } = $props();
let container: HTMLDivElement;

let resizeObserver: ResizeObserver | null = null;
let rafId = 0;

const gap = 16; // 1rem
const minColWidth = 300;

function layout() {
	if (!container) return;
	const items = Array.from(container.children) as HTMLElement[];
	if (items.length === 0) return;

	const containerWidth = container.clientWidth;
	const colCount = Math.max(
		1,
		Math.floor((containerWidth + gap) / (minColWidth + gap)),
	);
	const colWidth = (containerWidth - (colCount - 1) * gap) / colCount;

	const colHeights = new Array(colCount).fill(0);

	for (const item of items) {
		item.style.width = `${colWidth}px`;
		item.style.position = "absolute";

		const shortestCol = colHeights.indexOf(Math.min(...colHeights));
		const left = shortestCol * (colWidth + gap);
		const top = colHeights[shortestCol];

		item.style.transform = `translate(${left}px, ${top}px)`;
		colHeights[shortestCol] = top + item.offsetHeight + gap;
	}

	container.style.position = "relative";
	container.style.height = `${Math.max(...colHeights) - gap}px`;
}

onMount(() => {
	// 初始布局（延迟一帧确保 DOM 和图片首帧渲染完成）
	rafId = requestAnimationFrame(layout);

	// 监听容器宽度变化（响应式列数调整）
	resizeObserver = new ResizeObserver(() => {
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(layout);
	});
	resizeObserver.observe(container);

	// 监听图片加载（图片加载后高度变化需要重新布局）
	const images = container.querySelectorAll("img");
	for (const img of images) {
		if (img.complete) continue;
		img.addEventListener("load", () => {
			cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(layout);
		});
	}

	// Swup 页面切换后重新布局
	const onSwupContentReplaced = () => {
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(layout);
	};
	document.addEventListener("swup:contentReplaced", onSwupContentReplaced);

	return () => {
		resizeObserver?.disconnect();
		cancelAnimationFrame(rafId);
		document.removeEventListener("swup:contentReplaced", onSwupContentReplaced);
	};
});
</script>

<div bind:this={container} class="transition mb-4">
  {@render children?.()}
</div>
