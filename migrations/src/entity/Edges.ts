
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

import { Nodes } from './Nodes';

@Entity('edges')
@Unique(['from', 'to'])
export class Edges {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Nodes, {
        onDelete: "RESTRICT",
    })
    @JoinColumn({
        name: "from_id",
    })
    from: Nodes;

    @ManyToOne(type => Nodes, {
        onDelete: "RESTRICT",
    })
    @JoinColumn({
        name: "to_id",
    })
    to: Nodes;

    @Column("longtext", {
        nullable: true,
    })
    redirection: number;

    @Column("datetime", {
        default: () => 'CURRENT_TIMESTAMP',
    })
    created: Date;

    @Column("datetime", {
        default: () => null,
        nullable: true,
        onUpdate: "CURRENT_TIMESTAMP" // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
        // if in your version of mysql it's not supported then comment this line out and update manually in backend model
    })
    updated: Date;
}
