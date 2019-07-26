
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    JoinTable,
    ManyToMany,
    Unique,
} from "typeorm";

@Entity('nodes')
@Unique(['hash'])
export class Nodes {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 40,
    })
    hash: string;

    @Column({
        length: 4000,
    })
    url: string;

    @Column({
        nullable: true,
    })
    status: number;

    @Column("longtext", {
        nullable: true,
    })
    json: string;

    @Column({
        precision: 1 ,
        default: () => '0'
    })
    blocked: boolean;

    @Column({
        length: 4000,
        nullable: true,
    })
    origin: string;

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
