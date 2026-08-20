import React, { useEffect, useRef } from "react";
import bwipjs from "bwip-js";
import { type Order, PKR } from "@/lib/store";

export function ThermalLabel({ order }: { order: Order }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && order.trackingId) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128", 
          text: order.trackingId,
          scale: 3, 
          height: 10,
          includetext: true,
          textxalign: "center",
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }
  }, [order.trackingId]);

  return (
    <div className="w-[4in] h-[6in] bg-white text-black p-4 flex flex-col justify-between border border-gray-300 print:border-none mx-auto mb-4 page-break-after-always overflow-hidden" style={{ fontFamily: "monospace", boxSizing: "border-box" }}>
      {/* HEADER */}
      <div className="text-center border-b-2 border-black pb-2">
        <div className="flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PakDropship" style={{ height: 36, width: 36, objectFit: "contain" }} />
          <h1 className="text-xl font-black uppercase m-0 leading-none">PAKDROPSHIP LOGISTICS</h1>
        </div>
        <p className="text-sm font-bold mt-1 m-0">{order.courier || "Standard Delivery"}</p>
      </div>

      {/* TRACKING BARCODE */}
      <div className="flex flex-col items-center justify-center py-2 border-b-2 border-black">
        {order.trackingId ? (
          <canvas ref={canvasRef} />
        ) : (
          <p className="font-bold text-gray-500">NO TRACKING ID</p>
        )}
      </div>

      {/* ORDER INFO */}
      <div className="py-2 border-b-2 border-black text-sm leading-tight flex-1">
        <div className="grid grid-cols-2 gap-2 mb-2 font-bold text-xs">
          <div>ORDER: {order.id}</div>
          <div className="text-right">DATE: {new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
        
        <p className="font-bold uppercase mb-1 underline">Deliver To:</p>
        <p className="font-black text-base">{order.customerName}</p>
        <p className="font-bold text-sm">{order.phone1} {order.phone2 ? `/ ${order.phone2}` : ""}</p>
        <p className="mt-1">{order.address}</p>
        <p className="font-black text-base mt-1 uppercase">{order.city}</p>
      </div>

      {/* PRODUCT / COD INFO */}
      <div className="py-2 text-sm leading-tight">
        <p className="font-bold uppercase mb-1">Package Contents:</p>
        <p className="truncate font-bold">1x {order.productTitle}</p>
        <p className="text-xs">Variant: {order.variant}</p>

        <div className="mt-4 p-2 border-2 border-black text-center">
          <p className="text-sm font-bold uppercase">Cash on Delivery (COD)</p>
          <p className="text-2xl font-black mt-1">{PKR(order.collect)}</p>
        </div>
      </div>
    </div>
  );
}
