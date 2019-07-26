Installation:
    https://github.com/typeorm/typeorm#quick-start



CREATE DATABASE IF NOT EXISTS `knex` /*!40100 DEFAULT CHARACTER SET utf8 */





cli:
    Creating empty migration:
        node node_modules/.bin/typeorm migration:create -n PostRefactoring
            from: http://typeorm.io/#/migrations/creating-a-new-migration
    To update database to current schema run:
        yarn start
            No matter if you add or remove something it will be automaticly updated to current state
            UNFORTUNATELY IT MIGHT DESTROY RELATIONS BETWEEN DATABASE
                SEE SQL

























https://github.com/typeorm/typeorm#inverse-side-of-the-relationship