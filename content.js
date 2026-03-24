(function () {
    if (window.__RULER_TOOL_ACTIVE__) {
        document.getElementById("ruler-container")?.remove();
        window.__RULER_TOOL_ACTIVE__ = false;
        return;
    }

    window.__RULER_TOOL_ACTIVE__ = true;

    const container = document.createElement("div");
    container.id = "ruler-container";

    Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "999999"
    });

    document.body.appendChild(container);

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    let pxToMm = 0.264;
    let isWhite = false;

    let offsetX = 0;
    let offsetY = 0;

    let isDrawing = false;
    let start = null;
    let end = null;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;

        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawRulers() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const color = isWhite ? "#ffffff" : "#000000";

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.shadowColor = isWhite ? "black" : "white";
        ctx.shadowBlur = 2;

        ctx.font = "10px Arial";

        for (let x = -offsetX; x < window.innerWidth; x += 5) {
            const mm = ((x + offsetX) * pxToMm).toFixed(0);
            const isMajor = (x + offsetX) % 50 === 0;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, isMajor ? 15 : 8);
            ctx.stroke();

            if (isMajor) ctx.fillText(mm, x + 2, 25);
        }

        for (let y = -offsetY; y < window.innerHeight; y += 5) {
            const mm = ((y + offsetY) * pxToMm).toFixed(0);
            const isMajor = (y + offsetY) % 50 === 0;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(isMajor ? 15 : 8, y);
            ctx.stroke();

            if (isMajor) ctx.fillText(mm, 18, y + 3);
        }
    }

    function drawCrosshair(x, y) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.innerWidth, y);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, window.innerHeight);
        ctx.stroke();
    }

    function drawBox() {
        if (!start || !end) return;

        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);

        ctx.strokeRect(x, y, w, h);

        const wMm = (w * pxToMm).toFixed(2);
        const hMm = (h * pxToMm).toFixed(2);

        ctx.fillStyle = "black";
        ctx.fillRect(x + 5, y + 5, 130, 20);

        ctx.fillStyle = "white";
        ctx.fillText(`${wMm} mm × ${hMm} mm`, x + 8, y + 18);
    }

    function redraw(mx = null, my = null) {
        drawRulers();
        if (mx !== null) drawCrosshair(mx, my);
        if (isDrawing) drawBox();
    }

    resizeCanvas();
    drawRulers();

    canvas.addEventListener("mousedown", (e) => {
        isDrawing = true;
        start = { x: e.clientX, y: e.clientY };
        end = null;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (isDrawing) end = { x: e.clientX, y: e.clientY };
        redraw(e.clientX, e.clientY);
    });

    canvas.addEventListener("mouseup", (e) => {
        end = { x: e.clientX, y: e.clientY };
        isDrawing = false;
        redraw();
    });

    window.addEventListener("resize", () => {
        resizeCanvas();
        drawRulers();
    });

    window.addEventListener("keydown", (e) => {
        const step = 5;

        if (e.key === "ArrowRight") offsetX += step;
        if (e.key === "ArrowLeft") offsetX -= step;
        if (e.key === "ArrowDown") offsetY += step;
        if (e.key === "ArrowUp") offsetY -= step;

        if (e.key.toLowerCase() === "t") isWhite = !isWhite;

        if (e.key.toLowerCase() === "c") {
            alert("Click 2 points for calibration");
            let p1 = null;

            function clickHandler(ev) {
                if (!p1) p1 = { x: ev.clientX, y: ev.clientY };
                else {
                    const dx = ev.clientX - p1.x;
                    const dy = ev.clientY - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const real = prompt("Enter real size (mm):");
                    if (real) pxToMm = parseFloat(real) / dist;

                    window.removeEventListener("click", clickHandler);
                }
            }

            window.addEventListener("click", clickHandler);
        }

        if (e.key === "Escape") {
            container.remove();
            window.__RULER_TOOL_ACTIVE__ = false;
        }

        redraw();
    });
})();