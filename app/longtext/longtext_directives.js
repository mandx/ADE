/* ==================================================================
	AngularJS Datatype Editor - Text
	A directive to edit text in place

	Usage:
	<div ade-text='{"class":"input-large","id":"1234"}' ng-model="data">{{data}}</div>

	Config:
	"class" will be added to the input box so you can style it.
	"id" will be used in messages broadcast to the app on state changes.

	Messages:
		name: ADE-start  
		data: id from config

		name: ADE-finish
		data: {id from config, old value, new value, exit value}

------------------------------------------------------------------*/

adeModule.directive('adeLongtext', ['ADE','$compile','$rootScope',function(ADE,$compile,$rootScope) {
	return {
		require: '?ngModel', //optional dependency for ngModel
		restrict: 'A', //Attribute declaration eg: <div ade-text=""></div>

		//The link step (after compile)
		link: function($scope, element, attrs, controller) {
			var options = {},
                editing=false,
                txtArea=null,
                input = null,
                value = "",
                oldValue = "",
                exit = 0; //0=click, 1=tab, -1= shift tab, 2=return, -2=shift return, 3=esc. controls if you exited the field so you can focus the next field if appropriate

			//whenever the model changes, we get called so we can update our value
			if (controller != null) {
				controller.$render = function() { 
					oldValue = value = controller.$modelValue;
					if(value==undefined || value==null) value="";
					return controller.$viewValue;
				};
			}

			//called once the edit is done, so we can save the new data	and remove edit mode
			$scope.saveEdit = function(exited) {
				oldValue = value;
				exit = exited;

                if(exit != 2) {
                    if(exited!=3) { //don't save value on esc
                        value = txtArea.val();
                        controller.$setViewValue(value);
                    }

                    element.show();
                    input.remove();
                    editing=false;

                    ADE.done(options,oldValue,value,exit);

                    if(!$scope.$$phase) {
                        return $scope.$apply(); //This is necessary to get the model to match the value of the input
                    }
                } else {
                    txtArea.val(txtArea.val()+'\n');
                }
            };

            $scope.editLongText = function(showText) {
                var $linkPopup = element.next('.'+ $scope.adePopupClass +''),
                    elOffset, posLeft, posTop, content;

                content = (showText) ? value : '<textarea class="class="'+options.className+'">'+value+'</textarea>';

                if (!$linkPopup.length) {
                    elOffset = element.offset();
                    posLeft = elOffset.left;
                    posTop = elOffset.top + element[0].offsetHeight;
                    $compile('<div class="'+ $scope.adePopupClass +' ade-longtext dropdown-menu open" style="left:'+posLeft+'px;top:'+posTop+'px">'+content+'</div>')($scope).insertAfter(element);
                }

                input = element.next('.ade-longtext');
                txtArea = input.find('textarea');

                if (txtArea.length) {
                    txtArea.focus();

                    ADE.setupBlur(txtArea,$scope.saveEdit);
                    ADE.setupKeys(txtArea,$scope.saveEdit);
                } else {
                    input.bind('click', $scope.editLongText(false));
                    ADE.setupBlur(input,$scope.saveEdit);
                    ADE.setupKeys(input,$scope.saveEdit);
                }


                //make sure we aren't already digesting/applying before we apply the changes
                if(!$scope.$$phase) {
                    return $scope.$apply(); //This is necessary to get the model to match the value of the input
                }
            };
			
			//handles clicks on the read version of the data
			element.bind('click', function() {
				if(editing) return;
				editing=true;
				exit = 0;

				ADE.begin(options);

                $scope.editLongText(false);
			});
			
			// Watches for changes to the element
			// TODO: understand why I have to return the observer and why the observer returns element
			return attrs.$observe('adeLongtext', function(settings) { //settings is the contents of the ade-text="" string
				options = ADE.parseSettings(settings, {className:"input-xlarge"});
				return element;
			});
		}
	};
}]);