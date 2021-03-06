import * as d3 from "d3";
import data from "./data.json";

const width = 960;
const height = 500;

const format = d3.format(",d");
const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

const count = (elem: any) => elem.children && elem.children.length ? elem.children.map((child: any) => count(child)).reduce((acc: any, val: any) => acc + val, 0) : 1;

console.log(count(data));

const partition = (data: any) => {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.height - a.height || ((b.value || 0) - (a.value || 0)));
    return d3.partition()
        .size([height, (root.height + 1) * width / 10])
        (root);
}
const root = partition(data);

let focus = root;

const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .style("font", "10px sans-serif");

const cell = svg
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y0},${d.x0})`);

const rect = cell.append("rect")
    .attr("width", d => d.y1 - d.y0 - 1)
    .attr("height", d => rectHeight(d))
    .attr("fill-opacity", 0.6)
    .attr("fill", (d: any) => {
      if (!d.depth) return "#ccc";
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .style("cursor", "pointer")
    .on("click", clicked);

const text = cell.append("text")
    .style("user-select", "none")
    .attr("pointer-events", "none")
    .attr("x", 4)
    .attr("y", 13)
    .attr("fill-opacity", d => +labelVisible(d));

text.append("tspan")
    .text((d: any) => d.data.name);

const tspan = text.append("tspan")
    .attr("fill-opacity", (d: any) => labelVisible(d) ? 0.7: 0)
    .text((d: any) => ` ${format(d.value)}`);

cell.append("title")
    .text((d: any) => `${d.ancestors().map((d: any) => d.data.name).reverse().join("/")}\n${format(d.value)}`);

function clicked(event: any, p: any) {
    console.log(p);
  focus = focus === p ? p = p.parent : p;

  root.each((d: any) => d.target = {
    x0: (d.x0 - p.x0) / (p.x1 - p.x0) * height,
    x1: (d.x1 - p.x0) / (p.x1 - p.x0) * height,
    y0: d.y0 - p.y0,
    y1: d.y1 - p.y0
  });

  const t = cell.transition().duration(750)
      .attr("transform", (d: any) => `translate(${d.target.y0},${d.target.x0})`);

  rect.transition(t).attr("height", (d: any) => rectHeight(d.target));
  text.transition(t).attr("fill-opacity", (d: any) => +labelVisible(d.target));
  tspan.transition(t).attr("fill-opacity", (d: any) => +labelVisible(d.target) * 0.7);
}

function rectHeight(d: any) {
  return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
}

function labelVisible(d: any) {
  return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
}

const node = svg.node();

document.querySelector("body").append(node);
