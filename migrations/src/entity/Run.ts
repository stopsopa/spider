
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

@Entity('run')
@Unique(['hash'])
export class Run {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 40,
    })
    hash: string;

    @Column("datetime", {
        default: () => 'CURRENT_TIMESTAMP',
    })
    created: Date;
}
