import {MigrationInterface, QueryRunner} from "typeorm";

export class auto1564101009173 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `nodes` (`id` int NOT NULL AUTO_INCREMENT, `hash` varchar(40) NOT NULL, `url` varchar(4000) NOT NULL, `status` int NULL, `json` longtext NULL, `blocked` tinyint(1) NOT NULL DEFAULT 0, `origin` varchar(4000) NULL, `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated` datetime NULL ON UPDATE CURRENT_TIMESTAMP, UNIQUE INDEX `IDX_3374ecc0f2b9d6bd38bde18a84` (`hash`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `edges` (`id` int NOT NULL AUTO_INCREMENT, `redirection` longtext NULL, `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated` datetime NULL ON UPDATE CURRENT_TIMESTAMP, `from_id` int NULL, `to_id` int NULL, UNIQUE INDEX `IDX_8ca507be04a264ff6c6878ca21` (`from_id`, `to_id`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `run` (`id` int NOT NULL AUTO_INCREMENT, `hash` varchar(40) NOT NULL, `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX `IDX_c6ca0d04912fe37856f497396b` (`hash`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `logs` (`id` int NOT NULL AUTO_INCREMENT, `run` int NOT NULL, `node` int NULL, `edge` int NULL, UNIQUE INDEX `IDX_adac44f376713b59ab3d0ac213` (`run`, `node`, `edge`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `edges` ADD CONSTRAINT `FK_61f0550e7502d8c41a5c2d8645e` FOREIGN KEY (`from_id`) REFERENCES `nodes`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `edges` ADD CONSTRAINT `FK_31a91f785ea23862792ce67cdab` FOREIGN KEY (`to_id`) REFERENCES `nodes`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `logs` ADD CONSTRAINT `FK_fbf6fb64478fe9213449d1a67e4` FOREIGN KEY (`run`) REFERENCES `run`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `logs` ADD CONSTRAINT `FK_811d19ae6aaa771cd6a2bce9d48` FOREIGN KEY (`node`) REFERENCES `nodes`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `logs` ADD CONSTRAINT `FK_1b365c58241181322c8f4d97a2d` FOREIGN KEY (`edge`) REFERENCES `edges`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `logs` DROP FOREIGN KEY `FK_1b365c58241181322c8f4d97a2d`");
        await queryRunner.query("ALTER TABLE `logs` DROP FOREIGN KEY `FK_811d19ae6aaa771cd6a2bce9d48`");
        await queryRunner.query("ALTER TABLE `logs` DROP FOREIGN KEY `FK_fbf6fb64478fe9213449d1a67e4`");
        await queryRunner.query("ALTER TABLE `edges` DROP FOREIGN KEY `FK_31a91f785ea23862792ce67cdab`");
        await queryRunner.query("ALTER TABLE `edges` DROP FOREIGN KEY `FK_61f0550e7502d8c41a5c2d8645e`");
        await queryRunner.query("DROP INDEX `IDX_adac44f376713b59ab3d0ac213` ON `logs`");
        await queryRunner.query("DROP TABLE `logs`");
        await queryRunner.query("DROP INDEX `IDX_c6ca0d04912fe37856f497396b` ON `run`");
        await queryRunner.query("DROP TABLE `run`");
        await queryRunner.query("DROP INDEX `IDX_8ca507be04a264ff6c6878ca21` ON `edges`");
        await queryRunner.query("DROP TABLE `edges`");
        await queryRunner.query("DROP INDEX `IDX_3374ecc0f2b9d6bd38bde18a84` ON `nodes`");
        await queryRunner.query("DROP TABLE `nodes`");
    }

}
