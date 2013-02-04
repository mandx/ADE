/* ==================================================================
 AngularJS Datatype Editor - List
 A directive to pick a new value from a list of values

 Usage:
 <div ade-list='{id":"1234"}' ng-model="data">{{data}}</div>

 Config:
 "id" will be used in messages broadcast to the app on state changes.

 Messages:
 name: ADE-start
 data: id from config

 name: ADE-finish
 data: {id from config, old value, new value, exit value}

 ------------------------------------------------------------------*/
adeModule.directive('adeList', ['ADE', '$compile', '$rootScope', function(ADE, $compile, $rootScope) {
	return {
		require: '?ngModel', //optional dependency for ngModel
		restrict: 'A', //Attribute declaration eg: <div ade-list=""></div>

		//The link step (after compile)
		link: function($scope, element, attrs, controller) {
			var options = {}; //The passed in options to the directive.
			var editing = false; //are we in edit mode or not
			var input = null; //a reference to the input DOM object
			var value = "";
			var oldValue = "";
			var exit = 0; //0=click, 1=tab, -1= shift tab, 2=return, -2=shift return, 3=esc. controls if you exited the field so you can focus the next field if appropriate

			//whenever the model changes, we get called so we can update our value
			if (controller) {
				controller.$render = function() {
					oldValue = value = controller.$modelValue;
					if (value == undefined || value == null) value = "";
					return controller.$viewValue;
				};
			}

			//called once the edit is done, so we can save the new data and remove edit mode
			var saveEdit = function(exited) {
				oldValue = value;
				exit = exited;

				if (exited != 3) { //don't save value on esc
					value = input.data().select2.data();
					var v="";
					if (angular.isArray(value) && value.length > 0) {

						angular.forEach(value, function(val, key) {
							val = (key < value.length-1) ? val.text +"," : val.text;
							v += val;
						});
						value = v;
					} else if (angular.isObject(value) && value.text !== "") {
						value = value.text;
					} else {
						value = (value) ? value.text : "";
					}

					controller.$setViewValue(value);
				}

                if (exited !== 0) {
                    if (v) element[0].innerHTML = v;
                    element.show();
                    input.select2('destroy');
                    input.remove();
                }

                editing = false;
				ADE.done(options, oldValue, value, exit);

				if (!$scope.$$phase) {
					return $scope.$apply();
				}
			};

            $(document).bind("keydown", function(e) {
                $(document).find("div.select2-drop-active").each(function () {
                    if (e.keyCode == 27) { //esc
                        e.preventDefault();
                        e.stopPropagation();
                        var activeContainer = $(document).find('.select2-container-active');
                        var activeInput = activeContainer.next();
                        activeContainer.remove();
                        activeInput.remove();
                        element.show();
                        editing=false;
                    }
                });
            });

			//handles clicks on the read version of the data
			element.bind('click', function() {
				if (editing) return;
				editing = true;
				exit = 0;

				ADE.begin(options);
				element.hide();

				var multi = '';
				var placeholder = '';

				if (options.multiple) {
					multi = 'multiple="multiple"';
				} else {
					placeholder = ',placeholder:\'List...\'';
				}
				
				var query = '';
				if(options.query) query = ",query:" + options.query; //the user's query function for providing the list data
				var passthru = '';
				if(options.passthru) passthru = ",passthru:'" + options.passthru + "'"; //data that is passed through to the query function

				$compile('<input type="hidden" ui-select2={width:\'resolve\',allowClear:true,openOnEnter:false,searchClear:true,closeOnRemove:false,closeOnSelect:false,allowAddNewValues:true'+query+passthru+',initSelection:selection'+placeholder+'} ' + multi + ' />')($scope)
					.insertAfter(element);
				input = element.next('input');

				var data = [];
				var cleanValue = (value) ? value.split(',') : [];

				angular.forEach(cleanValue, function(value, key) {
					$scope.listOptions.map(function(v,i) {
						if (value === v) {
							data.push({'id':i,'text':v });
						}
					});
				});

				if (!options.multiple) data = data[0];

				setTimeout(function() {
					input.select2("data", data);
					input.select2("open");
				});

				input.on("change", function(e) {
                    if (e[0] === "singleRemove") {
                        saveEdit(0);
                    } else if (e[0] === "bodyClick") {
                        saveEdit();
                    } else {
                        if (!options.multiple) saveEdit();
                    }
				});

				//make sure we aren't already digesting/applying before we apply the changes
				if (!$scope.$$phase) {
					return $scope.$apply(); //This is necessary to get the model to match the value of the input
				}
			});

			// Watches for changes to the element
			// TODO: understand why I have to return the observer and why the observer returns element
			return attrs.$observe('adeList', function(settings) { //settings is the contents of the ade-list="" string
				options = ADE.parseSettings(settings, {
					multiple: false
				});
				return element;
			});
		}
	};
}]);

// Taken from Angular-UI and modified for our uses
// https://github.com/angular-ui/angular-ui
adeModule.directive('uiSelect2', ['$http', function($http) {
	var options = {};

	return {
		require: '?ngModel',
		compile: function(tElm, tAttrs) {
			var watch,
				repeatOption,
				repeatAttr,
				isSelect = tElm.is('select'),
				isMultiple = (tAttrs.multiple !== undefined);


			return function(scope, elm, attrs, controller) {
				// instance-specific options
				var opts = angular.extend({}, options, scope.$eval(attrs.uiSelect2));

				if (isMultiple) {
					opts.multiple = true;
				}

				if (controller) {
					// Watch the model for programmatic changes
					controller.$render = function() {
						if (isMultiple && !controller.$modelValue) {
							elm.select2('data', []);
						} else if (angular.isObject(controller.$modelValue)) {
							elm.select2('data', controller.$modelValue);
						} else {
							elm.select2('val', controller.$modelValue);
						}
					};


					// Watch the options dataset for changes
					if (watch) {
						scope.$watch(watch, function(newVal, oldVal, scope) {
							if (!newVal) return;
							// Delayed so that the options have time to be rendered
							setTimeout(function() {
								elm.select2('val', controller.$viewValue);
								// Refresh angular to remove the superfluous option
								elm.trigger('change');
							});
						});
					}

					if (!isSelect) {
						// Set the view and model value and update the angular template manually for the ajax/multiple select2.
						elm.bind("change", function() {
							scope.$apply(function() {
								controller.$setViewValue(elm.select2('data'));
							});
						});

						if (opts.initSelection) {
							var initSelection = opts.initSelection;
							opts.initSelection = function(element, callback) {
								initSelection(element, function(value) {
									controller.$setViewValue(value);
									callback(value);
								});
							};
						}
					}
				}

				attrs.$observe('disabled', function(value) {
					elm.select2(value && 'disable' || 'enable');
				});

				if (attrs.ngMultiple) {
					scope.$watch(attrs.ngMultiple, function(newVal) {
						elm.select2(opts);
					});
				}

				// Set initial value since Angular doesn't
				elm.val(scope.$eval(attrs.ngModel));

				// Initialize the plugin late so that the injected DOM does not disrupt the template compiler
				setTimeout(function() {
					elm.select2(opts);
				});
			};
		}
	};
}]);