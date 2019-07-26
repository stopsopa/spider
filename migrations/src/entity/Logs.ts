
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    Unique,
} from "typeorm";

import { Nodes } from "./Nodes";

import { Edges } from "./Edges";

import { Run } from "./Run";

@Entity('logs')
@Unique(['run', 'node', 'edge'])
export class Logs {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Run, {
        onDelete: "RESTRICT",
        nullable: false,
    })
    @JoinColumn({
        name: "run",
    })
    run: Run;

    @ManyToOne(type => Nodes, {
        onDelete: "RESTRICT",
    })
    @JoinColumn({
        name: "node",
    })
    node: Nodes;

    @ManyToOne(type => Edges, {
        onDelete: "RESTRICT",
    })
    @JoinColumn({
        name: "edge",
    })
    edge: Edges;
}
