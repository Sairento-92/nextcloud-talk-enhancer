/**
 * Smart Client-Side Image Optimizer for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const MAX_DIMENSION = 2560; // 2.5K max resolution
const MIN_SIZE_TO_OPTIMIZE = 2 * 1024 * 1024; // Only optimize if > 2MB

export async function optimizeImageFile(file) {
	if (!file.type.startsWith('image/') || file.size < MIN_SIZE_TO_OPTIMIZE) {
		return file;
	}

	return new Promise((resolve) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			img.onload = () => {
				let width = img.width;
				let height = img.height;

				if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size < 4 * 1024 * 1024) {
					resolve(file);
					return;
				}

				if (width > height) {
					if (width > MAX_DIMENSION) {
						height = Math.round((height * MAX_DIMENSION) / width);
						width = MAX_DIMENSION;
					}
				} else {
					if (height > MAX_DIMENSION) {
						width = Math.round((width * MAX_DIMENSION) / height);
						height = MAX_DIMENSION;
					}
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve(file);
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => {
						if (blob && blob.size < file.size) {
							const originalMb = (file.size / (1024 * 1024)).toFixed(1);
							const newMb = (blob.size / (1024 * 1024)).toFixed(1);
							console.info(`[TalkEnhancer] Image optimized: ${originalMb} MB -> ${newMb} MB`);

							showOptimizationToast(originalMb, newMb);
							const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
							resolve(optimizedFile);
						} else {
							resolve(file);
						}
					},
					'image/jpeg',
					0.88
				);
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	});
}

function showOptimizationToast(origMb, newMb) {
	const toast = document.createElement('div');
	toast.innerHTML = `⚡ <b>Optymalizacja zdjęcia:</b> ${origMb} MB ➔ <b>${newMb} MB</b> (błyskawiczny upload)`;
	toast.style.cssText = 'position:fixed;bottom:80px;right:20px;background:#18321e;border:1px solid #2ecc71;border-radius:10px;padding:8px 16px;color:#2ecc71;font-size:12px;font-family:system-ui,sans-serif;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:fadeIn 0.2s ease;';
	document.body.appendChild(toast);
	setTimeout(() => toast.remove(), 4000);
}

export function setupImageOptimizerWeb(isDesktop) {
	if (isDesktop) return;

	// Intercept file input change
	document.addEventListener(
		'change',
		async (e) => {
			const target = e.target;
			if (target && target.matches('input[type="file"]') && target.files && target.files.length > 0) {
				const file = target.files[0];
				if (file.type.startsWith('image/') && file.size > MIN_SIZE_TO_OPTIMIZE) {
					e.stopImmediatePropagation();
					const optimized = await optimizeImageFile(file);
					const dt = new DataTransfer();
					dt.items.add(optimized);
					target.files = dt.files;
					target.dispatchEvent(new Event('change', { bubbles: true }));
				}
			}
		},
		true
	);

	// Intercept paste of images
	document.addEventListener(
		'paste',
		async (e) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				if (items[i].type.startsWith('image/')) {
					const file = items[i].getAsFile();
					if (file && file.size > MIN_SIZE_TO_OPTIMIZE) {
						e.preventDefault();
						const optimized = await optimizeImageFile(file);
						const fileInput = document.querySelector('input[type="file"]');
						if (fileInput) {
							const dt = new DataTransfer();
							dt.items.add(optimized);
							fileInput.files = dt.files;
							fileInput.dispatchEvent(new Event('change', { bubbles: true }));
						}
					}
				}
			}
		},
		true
	);
}
