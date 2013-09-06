var JQB;
(function (JQB) {
    (function (Schema) {
        var Database = (function () {
            function Database(schemaCsv) {
                this.tables = [];
                this.parseSchemaCsv(schemaCsv);
            }
            Database.prototype.table = function (name) {
                for (var i = 0; i < this.tables.length; i++) {
                    if (this.tables[i].name === name) {
                        return this.tables[i];
                    }
                }
                return null;
            };

            Database.prototype.parseSchemaCsv = function (schemaCsv) {
                var lines = schemaCsv.split("\n");
                var table = null;
                for (var i = 0, len = lines.length; i < len; i++) {
                    var vals = lines[i].split(',');
                    if (table === null || table.name != vals[0]) {
                        table = new Table(vals[0]);
                        this.tables.push(table);
                    }
                    var isPk = vals[3] != null && vals[3].toLowerCase()[0] == 'p';
                    table.addColumn(new Column(vals[1], vals[2], isPk));
                }
            };
            return Database;
        })();
        Schema.Database = Database;

        var Table = (function () {
            function Table(name) {
                this.name = name;
                this.columns = [];
            }
            Table.prototype.singularize = function () {
                if (this.name.match(/ies$/)) {
                    return this.name.substr(0, this.name.length - 3) + 'y';
                }
                if (this.name.match(/s$/)) {
                    return this.name.substr(0, this.name.length - 1);
                }
                return this.name;
            };

            Table.prototype.addColumn = function (column) {
                this.columns.push(column);
            };

            Table.prototype.guessForeignKeys = function (candidates) {
                var joins = [];
                for (var i = 0; i < candidates.length; i++) {
                    joins = joins.concat(this.guessMyForeignKeysTo(candidates[i]));
                    joins = joins.concat(candidates[i].guessMyForeignKeysTo(this));
                }
                return joins;
            };

            Table.prototype.guessMyForeignKeysTo = function (primary) {
                var primaryPk = primary.getPrimaryKey();
                for (var i = 0; i < this.columns.length; i++) {
                    var col = this.columns[i];
                    if (col.name === primary.name + '_id' || col.name === primary.singularize() + '_id') {
                        return [new ForeignKey(primary, this, [primaryPk], [col])];
                    }
                }
                return [];
            };

            Table.prototype.getPrimaryKey = function () {
                if (this.columns.length === 0)
                    return null;
                for (var i = 0; i < this.columns.length; i++) {
                    if (this.columns[i].isPk) {
                        return this.columns[i];
                    }
                }
                return this.columns[0];
            };
            return Table;
        })();
        Schema.Table = Table;

        var ForeignKey = (function () {
            function ForeignKey(primary, fkOwner, primaryColumns, fkColumns) {
                this.primary = primary;
                this.fkOwner = fkOwner;
                this.primaryColumns = primaryColumns;
                this.fkColumns = fkColumns;
            }
            return ForeignKey;
        })();
        Schema.ForeignKey = ForeignKey;

        var Column = (function () {
            function Column(name, datatype, isPk) {
                this.name = name;
                this.datatype = datatype;
                this.isPk = isPk;
            }
            Column.prototype.isPkOrFk = function () {
                return this.isPk || this.name === 'id' || this.name.match(/_id/);
            };
            return Column;
        })();
        Schema.Column = Column;
    })(JQB.Schema || (JQB.Schema = {}));
    var Schema = JQB.Schema;
})(JQB || (JQB = {}));
