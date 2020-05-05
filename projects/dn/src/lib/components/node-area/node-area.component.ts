import { Component, OnInit } from '@angular/core';
import { Position } from '../../data/position';

@Component({
  selector: 'dn-node-area',
  templateUrl: './node-area.component.html',
  styleUrls: ['./node-area.component.scss']
})
export class NodeAreaComponent implements OnInit {

  nodes: { title: string, position: Position }[];

  get connections(): ({ from: Position, to: Position }[]) {
    const from = this.nodes.slice(1);
    const to = this.nodes.slice(0, -1);

    return from
      .map((f, i) => [f, to[i]])
      .map(([f, t]) => ({
        from: { x: f.position.x + 184, y: f.position.y + 64 },
        to: { x: t.position.x + 16, y: t.position.y + 50 }
      }));
  }

  constructor() {
    this.nodes = [
      { title: 'a', position: { x: 100, y: 200 } },
      { title: 'b', position: { x: 500, y: 100 } },
      { title: 'c', position: { x: 400, y: 350 } },
      { title: 'd', position: { x: 200, y: 500 } }
    ];
  }

  ngOnInit(): void {
  }

  getPath(connection: { from: Position, to: Position }) {
    const { from, to } = connection;
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const dist = Math.sqrt(dx * dx + dy * dy);

    const handleLength = dist / 2;

    return `M${from.x},${from.y} C${from.x + handleLength},${from.y} ${to.x - handleLength},${to.y}, ${to.x},${to.y}`;
  }

}
