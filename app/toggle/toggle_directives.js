/* ==================================================================
 AngularJS Datatype Editor - Toggle
 A directive to toggle a star, checkbox or other icon

 Usage:
 <a ade-toggle ade-id="1234" ade-class="ade-star" ng-model="data"></a>

Config:

ade-id:
	If this id is set, it will be used in messages broadcast to the app on state changes.
ade-class:
	A custom class to give to the div so that you can use your own images
ade-readonly:
	If you don't want the stars to be editable


 Messages:
 name: ADE-start
 data: id from config

 name: ADE-finish
 data: {id from config, old value, new value}

 ------------------------------------------------------------------*/

angular.module('ADE').directive('adeToggle', ['ADE','$compile','$filter', function(ADE,$compile,$filter) {
	return {
		require: '?ngModel', //optional dependency for ngModel
		restrict: 'A', //Attribute declaration eg: <div ade-toggle=""></div>

		scope: {
			adeId: "@",
			adeClass: "@",
			adeReadonly: "@",
			ngModel: "="
		},

		//The link step (after compile)
		link: function(scope, element, attrs) {
			var starClass = "ade-star";
			var readonly = false;

			if(scope.adeClass!==undefined) starClass = scope.adeClass;
			if(scope.adeReadonly!==undefined && scope.adeReadonly=="1") readonly = true;

			//generates HTML for the star
			var makeHTML = function() {
				var input = scope.ngModel;
				if(angular.isArray(input)) input = input[0];
				if(angular.isString(input)) {
					input = input.toLowerCase();
					if(input=='false' || input=='no' || input=='0' || input=='o') input = false;
				}

				var state = (input ? 'ade-on' : 'ade-off');

				element.html('<span class="ade-toggle '+starClass+' '+state+'">');
			}

			var clickHandler = function(e) {
				e.preventDefault();
				e.stopPropagation();

				ADE.begin(scope.adeId);

				var oldValue = scope.ngModel;
				scope.ngModel = (scope.ngModel) ? false : true;

				ADE.done(scope.adeId, oldValue, scope.ngModel, 0);
			};

			var focusHandler = function(e) {
				element.on('keypress.ADE', function(e) {
					if (e.keyCode == 13) { //return
						e.preventDefault();
						e.stopPropagation();
						element.click();
					}
				});
			};
			
			//setup events
			if(!readonly) {
				element.on('click.ADE', function(e) {
					scope.$apply(function() {
						clickHandler(e);
					})
				});
				element.on('focus.ADE',  function(e) {
					scope.$apply(function() {
						focusHandler(e);
					})
				});
				element.on('blur.ADE', function(e) {
					element.off('keypress.ADE');
				});
			}

			scope.$on('$destroy', function() { //need to clean up the event watchers when the scope is destroyed
				if(element) {
					element.off('click.ADE');
					element.off('focus.ADE');
					element.off('blur.ADE');
					element.off('keypress.ADE');
				}
			});
			
			//need to watch the model for changes
			scope.$watch(function(scope) {
				return scope.ngModel;
			}, function () {
				makeHTML();
			});

		}
	};
}]);