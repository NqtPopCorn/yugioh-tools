import React, { useState, useEffect, useRef } from "react";
import { Network } from "vis-network";
import "vis-network/styles/vis-network.css"; // Import CSS của vis-network nếu cần

const LinkMaker = () => {
    // State quản lý các tham số đầu vào
    const [nodeCount, setNodeCount] = useState(3);
    const [probability, setProbability] = useState(0.5);

    // State lưu trữ các thông số thống kê để hiển thị
    const [stats, setStats] = useState({
        edgeCount: 0,
        maxEdges: 0,
        density: 0,
        threshold: 0,
        stateBigInt: "0",
    });

    // Ref để tham chiếu đến thẻ div chứa đồ thị
    const networkRef = useRef(null);
    // Ref để lưu trữ instance của vis.Network (để destroy khi cần vẽ lại)
    const networkInstance = useRef(null);

    // Hàm tạo đồ thị (Core Logic)
    const generateGraph = () => {
        const n = parseInt(nodeCount);
        const p = parseFloat(probability);

        // 1. Tạo Nodes
        const nodesArray = [];
        for (let i = 0; i < n; i++) {
            nodesArray.push({ id: i, label: `P${i + 1}` });
        }

        // 2. Tạo Edges dựa trên xác suất p (Erdős–Rényi)
        const edgesArray = [];
        let edgeCount = 0;
        const maxEdges = (n * (n - 1)) / 2;
        let binaryString = "";

        // Duyệt ma trận tam giác trên
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const randomVal = Math.random();

                if (randomVal < p) {
                    // Có cạnh
                    edgesArray.push({ from: i, to: j });
                    edgeCount++;
                    binaryString += "1";
                } else {
                    // Không có cạnh
                    binaryString += "0";
                }
            }
        }

        // Xử lý BigInt
        let stateBigInt = "0";
        try {
            // Nếu binaryString rỗng (n < 2), gán là "0"
            stateBigInt = BigInt("0b" + (binaryString || "0")).toString();
        } catch (e) {
            stateBigInt = "Too huge";
        }

        // Cập nhật State thống kê
        const threshold = n > 0 ? Math.log(n) / n : 0;
        setStats({
            edgeCount,
            maxEdges,
            density: maxEdges > 0 ? (edgeCount / maxEdges).toFixed(2) : 0,
            threshold: threshold.toFixed(2),
            stateBigInt,
        });

        // 3. Vẽ Vis.js Network
        if (networkRef.current) {
            const data = {
                nodes: nodesArray,
                edges: edgesArray,
            };

            const options = {
                nodes: {
                    shape: "dot",
                    size: 15,
                    color: { background: "#4CAF50", border: "#388E3C" },
                    font: { color: "#333" },
                },
                edges: { color: "#999" },
                physics: { enable: false },
                height: "100%", // Đảm bảo fill chiều cao container
                width: "100%",
            };

            // Nếu đã có instance cũ thì destroy trước khi tạo mới (tránh leak memory)
            if (networkInstance.current) {
                networkInstance.current.destroy();
            }

            networkInstance.current = new Network(
                networkRef.current,
                data,
                options
            );
        }
    };

    // Tự động tạo đồ thị lần đầu khi component mount
    useEffect(() => {
        generateGraph();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-[#f4f7f6] flex flex-col items-center p-5 font-sans">
            <div className="w-full max-w-5xl bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Multiplayer Format Link Maker
                </h1>

                {/* Controls Area */}
                <div className="grid grid-col-2 p-2 mb-3">
                    {/* Slider Số Nodes */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700">
                            Số người chơi (Nodes):{" "}
                            <span className="text-pink-600 font-bold text-lg">
                                {nodeCount}
                            </span>
                        </label>
                        <input
                            type="number"
                            min="2"
                            max="30"
                            value={nodeCount}
                            onChange={(e) => setNodeCount(e.target.value)}
                            className="rounded-lg appearance-none cursor-pointer border border-gray-300 p-2 max-w-30 me-2"
                        />
                    </div>

                    {/* Slider Xác suất P */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700">
                            Xác suất thù địch (p):{" "}
                            <span className="text-pink-600 font-bold text-lg">
                                {probability}
                            </span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={probability}
                            onChange={(e) => setProbability(e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                    </div>
                    <div className="col-span-2 flex justify-center">
                        {/* Button */}
                        <button
                            onClick={generateGraph}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md active:scale-95 m-auto"
                        >
                            Tạo Đồ Thị
                        </button>
                    </div>
                </div>

                {/* Network Visualization Area */}
                <div
                    ref={networkRef}
                    className="w-full h-[500px] border border-gray-200 rounded-lg bg-gray-50 mb-4"
                ></div>

                {/* Statistics Area */}
                <div className="flex flex-col md:flex-row justify-between text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="leading-loose">
                        <p>
                            Số cạnh thực tế:{" "}
                            <span className="font-bold text-gray-800">
                                {stats.edgeCount}
                            </span>{" "}
                            / {stats.maxEdges}
                        </p>
                        <p>
                            Mật độ (Density):{" "}
                            <span className="font-bold text-gray-800">
                                {stats.density}
                            </span>{" "}
                            (Target p: {probability})
                        </p>
                    </div>
                    <div className="md:text-right mt-4 md:mt-0 leading-loose">
                        <p>
                            Ngưỡng liên thông (ln(n)/n):{" "}
                            <span className="font-bold text-gray-800">
                                {stats.threshold}
                            </span>
                        </p>
                        <p
                            className="truncate max-w-xs md:max-w-md"
                            title={stats.stateBigInt}
                        >
                            Mã trạng thái (BigInt):{" "}
                            <span className="font-mono bg-gray-200 px-1 rounded text-xs">
                                {stats.stateBigInt.length > 20
                                    ? stats.stateBigInt.substring(0, 20) + "..."
                                    : stats.stateBigInt}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkMaker;
