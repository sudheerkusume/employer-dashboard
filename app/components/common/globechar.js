"use client";
import { useEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export default function GlobeChart() {
    useEffect(() => {
        let root;

        // Load worldLow.js via script tag
        const script = document.createElement("script");
        script.src = "https://cdn.amcharts.com/lib/5/geodata/worldLow.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            root = am5.Root.new("chartdiv");
            root.setThemes([am5themes_Animated.new(root)]);

            const chart = root.container.children.push(
                am5map.MapChart.new(root, {
                    panX: "rotateX",
                    panY: "rotateY",
                    projection: am5map.geoOrthographic(),
                    paddingBottom: 20,
                    paddingTop: 20,
                    paddingLeft: 20,
                    paddingRight: 20,
                })
            );

            const polygonSeries = chart.series.push(
                am5map.MapPolygonSeries.new(root, {
                    geoJSON: window.am5geodata_worldLow,
                })
            );

            // Set yellow colors for countries
            polygonSeries.mapPolygons.template.setAll({
                tooltipText: "{name}",
                toggleKey: "active",
                interactive: true,
                fill: am5.color("#D79A2F"), // Yellow color
                stroke: am5.color("#D79A2F"), // Dark yellow border
                strokeWidth: 0.5,
            });

            // Hover state with brighter yellow
            polygonSeries.mapPolygons.template.states.create("hover", {
                fill: am5.color("#FFEC8B"), // Light yellow on hover
                stroke: am5.color("#FFD700"),
                strokeWidth: 1,
            });

            // Background series for ocean
            const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
            backgroundSeries.mapPolygons.template.setAll({
                fill: am5.color("#ffffff"), // Dark blue ocean
                fillOpacity: 0.8,
                strokeOpacity: 0,
            });
            backgroundSeries.data.push({
                geometry: am5map.getGeoRectangle(90, 180, -90, -180),
            });

            // Graticule series (grid lines)
            const graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
            graticuleSeries.mapLines.template.setAll({
                strokeOpacity: 0.2,
                stroke: am5.color("#FFD700"), // Yellow grid lines
                strokeWidth: 0.5,
            });

            // Rotation animation
            chart.animate({
                key: "rotationX",
                from: 0,
                to: 360,
                duration: 30000,
                loops: Infinity,
            });

            chart.appear(1000, 100);
        };

        return () => {
            if (root) root.dispose();
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="w-36 h-36">
            <div id="chartdiv" className="w-full h-full" />
        </div>
    );
}