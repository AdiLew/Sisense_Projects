prism.run([
	'plugin-orFilters.services.bindOnce',
    function($bindOnce) {

		//Determine whether a dimension is included in the orFilters array in the config variable.
        function isFilterInArgs(table, column, filtersOfChoice) {
            return filtersOfChoice.some(i => {
                return (i.table.toUpperCase() === table.toUpperCase() && i.column.toUpperCase() === column.toUpperCase());
            });
        };
		
		
		function isWidgetInList(oid, list){
			return list.some(id =>{
				return oid === id;
			});
		};
        
		
		function addOrFiltersToQuery(dash, q) {

			let config = dash.orFiltersConfig;
            let metadata = $.extend(true, q.query.metadata, []);
            //Array to store the new Metadata object to replace the existing one.
            let newMetadata = [];
            //Array to store the filters that should go underthe OR operator
            let orFilters = [];
			
            //Define the JAQL object to contain the or filters.
            //In order apply an OR between different fields, we have to choose a single field and filter it with attribute filters. the OR can only fit within this filter's  the filters we have to 
            let orJaql = {
                'jaql': {
                    'table': config.pk.table,
                    'column': config.pk.column,
                    'datatype': config.pk.datatype,
                    'filter': {
                        'or': []
                    }
                },
                'panel': 'scope'
            };

            if ((config.mode === 'include' && !(isWidgetInList(widget.oid, config.includeWidgets))) || (config.mode === 'exclude' && (isWidgetInList(widget.oid,config.excludeWidgets)))) {
                return;
            }
            //Segregate the Or Filters from the rest of the fields in the query.
            //Send the or filters to the orFilters array and the rest to the newMetadata Array
            metadata.forEach(function(item, idx) {
                if (item.panel === 'scope' && isFilterInArgs(item.jaql.table, item.jaql.column, config.orFilters)) {
                    orFilters.push(item);
                } else {
                    newMetadata.push(item);
                };
            });

            if (orFilters.length > 0) {
                //Format the OrFIlters to fit the jaql and add them as attribute filters to the orJaql's or array
                orFilters.forEach(function(f) {
                    let obj = {
                        'attributes': {
                            'table': f.jaql.table,
                            'column': f.jaql.column,
                            'datatype': f.jaql.datatype,
                            'filter': f.jaql.filter
                        }
                    }
                    if (f.jaql.datatype === 'datetime') {
                        obj['attributes']['level'] = f.jaql.level;
                    }
                    orJaql.jaql.filter.or.push(obj);
                });

                //Push the new OR filter object into the newMetadata object
                newMetadata.push(orJaql);

                //replace the existing metadata object with the new one
                q.query.metadata = newMetadata;
            };
        };
		
		function onDashboardLoaded (scope, args){
			let config = args.dashboard.orFiltersConfig;
			//Determine running Mode: 
			//Include mode will apply the orFilters only to the widgets in the Include array, while exclude mode will apply it to all widgets in the dashboard except for the widgets in the Exclude array.
			//If neither include or exclude are provided, ir they are both null, the orFilter will be applied to all widgets in the dashboard.
			
			if (config.includeWidgets && config.includeWidgets.length > 0){
				config.mode = 'include';
			}
			else if (config.excludeWidgets && config.excludeWidgets.length > 0){
				config.mode = 'exclude';
			}
			else {
				config.mode = 'all';
			};
			
			/*args.dashboard.widgets.$$widgets.forEach(function(widget){
				if (config.mode ==='all' || (config.mode === 'include' && isWidgetInList(widget.oid, config.includeWidgets)) || (config.mode === 'exclude' && !(isWidgetInList(widget.oid,config.excludeWidgets))))
                $bindOnce(widget, "beforequery", addOrFiltersToQuery);
			});

			args.dashboard.on("widgetbeforequery", () => {
			    debugger;
            })*/

            $bindOnce(args.dashboard, "widgetbeforequery", addOrFiltersToQuery);
			
		};
		
		//The plugin's function(s) will be stored in prism's plugins attribute. 
		//Prepare for the function's definition by creating this attribute if it doesn't already exist
        if (typeof prism.plugins === 'undefined') {
            prism.plugins = {};
        };
		
		//Create object to hold plugin functions
		prism.plugins.orFilters = {};
		
        prism.plugins.orFilters.applyOrFilters = function() {
            prism.on('dashboardloaded', onDashboardLoaded);
        };


    }
]);