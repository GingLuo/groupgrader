// Use PDF.js to render a PDF file

function renderPDF(initial_page) {

	const pageNum = document.querySelector('#page_num');
	const pageCount = document.querySelector('#page_count');
	let currentPage = document.querySelector('#current_page');
	const previousPage = document.querySelector('#prev_page');
	const nextPage = document.querySelector('#next_page');
	const zoomIn = document.querySelector('#zoom_in');
	const zoomOut = document.querySelector('#zoom_out');

	const initialState = {
		pdfDoc: null,
		currentPage: initial_page,
		pageCount: 0,
		// NOTE: Important: 
		zoom: 5, // This is resolution
		layout_scale: 0.75, // This is the actual 'scale'
	};


	pdfjsLib
	.getDocument(pdf)
	.promise.then((data) => {
		initialState.pdfDoc = data;
		console.log('pdfDocument', initialState.pdfDoc);

		pageCount.textContent = initialState.pdfDoc.numPages;

		renderPage();
	})
	.catch((err) => {
		alert(err.message);
	});


	// Render the page.
	const renderPage = () => {

		// Load the first page.
		console.log(initialState.pdfDoc, 'pdfDoc');
		initialState.pdfDoc
			.getPage(initialState.currentPage)
			.then((page) => {
				console.log('page', page);

				const canvas = document.querySelector('#canvas');
				const ctx = canvas.getContext('2d');
				const viewport = page.getViewport({
					scale: initialState.zoom,
				});
	
				canvas.height = viewport.height;
				canvas.width = viewport.width;

				// https://stackoverflow.com/questions/35400722/pdf-image-quality-is-bad-using-pdf-js
				// Resolution issue

				const wrapper = document.querySelector('#canvas-wrapper');


				canvas.style.width = "100%";
				canvas.style.height = "100%";

				wrapper.style.width = Math.floor(viewport.width/initialState.zoom)*initialState.layout_scale + 'pt';
				wrapper.style.height = Math.floor(viewport.height/initialState.zoom)*initialState.layout_scale + 'pt';
				
				const outmost = document.querySelector('#outmost');
				if (initialState.layout_scale > 0.75){
					outmost.style.height=Math.floor(viewport.height/initialState.zoom)*initialState.layout_scale + 'pt';
				}else{
					outmost.style.height="100vh";
				}

				const renderCtx = {
					canvasContext: ctx,
					viewport: viewport,
				};

				page.render(renderCtx);

				pageNum.textContent = initialState.currentPage;
			});
	};

	const showPrevPage = () => {
		if (initialState.pdfDoc === null || initialState.currentPage <= 1)
			return;
		initialState.currentPage--;

		// Render the current page.
		currentPage.value = initialState.currentPage;
		renderPage();
	};

	const showNextPage = () => {
		if (
			initialState.pdfDoc === null ||
			initialState.currentPage >= initialState.pdfDoc._pdfInfo.numPages
		)
			return;

		initialState.currentPage++;
		currentPage.value = initialState.currentPage;
		renderPage();
	};

	// https://pspdfkit.com/blog/2021/how-to-build-a-javascript-pdf-viewer-with-pdfjs/
	previousPage.addEventListener('click', showPrevPage);
	nextPage.addEventListener('click', showNextPage);
	currentPage.value = initialState.currentPage;

	// Keypress event.
	currentPage.addEventListener('keydown', (event) => {
		if (initialState.pdfDoc === null) return;

		if (event.which === 13) {
			let desiredPage = currentPage.valueAsNumber;
			initialState.currentPage = Math.min(
				Math.max(desiredPage, 1),
				initialState.pdfDoc._pdfInfo.numPages,
			);

			currentPage.value = initialState.currentPage;
			renderPage();
		}
	});

	// This is used for grader assignmentGrading page and student assignment page
	// Why set to onclick?
	// Other events fired by jquery can't trigger page change
	// On those pages, current_page is set to hidden
	currentPage.addEventListener('click', () => {
		if (initialState.pdfDoc === null) return;

		// Get the key code.
		// Get the new page number and render it.
		let desiredPage = currentPage.valueAsNumber;
		initialState.currentPage = Math.min(
			Math.max(desiredPage, 1),
			initialState.pdfDoc._pdfInfo.numPages,
		);

		currentPage.value = initialState.currentPage;
		renderPage();
	});

	// Zoom events.
	zoomIn.addEventListener('click', () => {
		if (initialState.pdfDoc === null) return;
		initialState.layout_scale *= 4 / 3;
		renderPage();
	});

	zoomOut.addEventListener('click', () => {
		if (initialState.pdfDoc === null) return;
		initialState.layout_scale *= 2 / 3;
		renderPage();
	});

}

function changeCurrentPage(num){
	var e = jQuery.Event("click");

	// console.log($("#current_page").val())
	$("#current_page").val(num)
	$("#current_page").trigger(e);
	// console.log($("#current_page").val())

}