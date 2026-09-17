import BaseComponent from "./BaseComponent.js";
import MatchMedia from "./MatchMedia.js";

const rootSelector = '[data-js-select]';

class Select extends BaseComponent {
  selectors = {
    root: rootSelector,
    originalControl: '[data-js-original-control]',
    button: '[data-js-select-button]',
    dropDown: '[data-js-select-drop-down]',
    option: '[data-js-select-option]',
  }

  stateClasses = {
    isExpanded: 'is-expanded',
    isSelected: 'is-selected',
    isCurrent: 'is-current',
    isOnTheLeftSide: 'is-on-the-left-side',
    isOnTheRightSide: 'is-on-the-right-side',
  }

  stateAttributes = {
    ariaExpanded: 'aria-expanded',
    ariaSelected: 'aria-selected',
    ariaActiveDescendant: 'aria-activedescendant',
  }

  initialState = {
    isExpanded: false,
    currentOptionIndex: null,
    selectedOptionElement: null,
  }

  constructor(rootElement) {
    super();
    this.rootElement = rootElement;
    this.originalControl = this.rootElement.querySelector(this.selectors.originalControl);
    this.buttonElement = this.rootElement.querySelector(this.selectors.button);
    this.dropDownElement = this.rootElement.querySelector(this.selectors.dropDown);
    this.optionElements = this.dropDownElement.querySelectorAll(this.selectors.option);

    this.state = this.getProxyState({
      ...this.initialState,
      currentOptionIndex: this.originalControl.selectedIndex,
      selectedOptionElement: this.optionElements[this.originalControl.selectedIndex],
    });
    this.fixDropDownPosition();
    this.updateTabIndexes();

    this.bindEvents();
  }

  selectCurrentOption()  {
    this.state.selectedOptionElement = this.optionElements[this.state.currentOptionIndex];
  }

  onButtonClick = () => {
    this.toggleExpandedState();
  }

  onClick = (event) => {
    const { target } = event;

    const isOutSideDropDownClick = target.closest(this.selectors.dropDown) !== this.dropDownElement;
    const isButtonClick = target === this.buttonElement;

    if (!isButtonClick && isOutSideDropDownClick) {
      this.collapse();
      return
    }

    const isOptionClick = target.matches(this.selectors.option);

    if (isOptionClick) {
      this.state.selectedOptionElement = target;
      this.state.currentOptionIndex = [...this.optionElements].findIndex(
        (option) => option === target
      );
      this.collapse();
    }
  }

  toggleExpandedState() {
    this.state.isExpanded = !this.state.isExpanded;
  }

  expand() {
    this.state.isExpanded = true;
  }

  collapse() {
    this.state.isExpanded = false;
  }

  updateUI() {
    const { isExpanded, currentOptionIndex, selectedOptionElement } = this.state;

    const newSelectedOptionValue = selectedOptionElement.textContent.trim()

    const updateOriginalControl = () => {
      this.originalControl.value = newSelectedOptionValue;
    };

    const updateButton = () => {
      this.buttonElement.textContent = newSelectedOptionValue;
      this.buttonElement.classList.toggle(this.stateClasses.isExpanded, isExpanded);
      this.buttonElement.setAttribute(this.stateAttributes.ariaExpanded, isExpanded);
      this.buttonElement.setAttribute(
        this.stateAttributes.ariaActiveDescendant,
        this.optionElements[currentOptionIndex].id,
      )
    };

    const updateDropDown = () => {
      this.dropDownElement.classList.toggle(this.stateClasses.isExpanded, isExpanded);
    };

    const updateOptions = () => {
      this.optionElements.forEach((option, index) => {
        const isCurrent = index === currentOptionIndex;
        const isSelected = option === selectedOptionElement;

        option.classList.toggle(this.stateClasses.isCurrent, isCurrent);
        option.classList.toggle(this.stateClasses.isSelected, isSelected);
        option.setAttribute(this.stateAttributes.ariaSelected, isSelected);
      })
    };

    updateOriginalControl();
    updateButton();
    updateDropDown();
    updateOptions();
  }

  onMobileMatchMediaChange = (event) => {
    this.updateTabIndexes(event.matches);
  }

  fixDropDownPosition() {
    const viewPortWidth = document.documentElement.clientWidth;
    const halfViewPortX = viewPortWidth / 2;
    const { width , x } = this.buttonElement.getBoundingClientRect();
    const buttonCenterX = x + width / 2;
    const isButtonOnTheLeftSide = buttonCenterX < halfViewPortX;

    this.dropDownElement.classList.toggle(this.stateClasses.isOnTheLeftSide, isButtonOnTheLeftSide);

    this.dropDownElement.classList.toggle(this.stateClasses.isOnTheRightSide, !isButtonOnTheLeftSide);
  }

  get isNeedToExpand() {
    const isButtonFocused = document.activeElement === this.buttonElement

    return (!this.state.isExpanded && isButtonFocused);
  }

  onArrowUpKeyDown = () => {
    if (this.isNeedToExpand) {
      this.expand();
      return;
    }

    if (this.state.currentOptionIndex > 0) {
      this.state.currentOptionIndex--;
    }
  }

  onOriginalControlChange = () => {
    this.state.selectedOptionElement = this.optionElements[this.originalControl.selectedIndex];
  }

  onArrowDownKeyDown = () => {
    if (this.isNeedToExpand) {
      this.expand();
      return;
    }

    if (this.state.currentOptionIndex < this.optionElements.length - 1) {
      this.state.currentOptionIndex++;
    }
  }

  onSpaceKeyDown = () => {
    if (this.isNeedToExpand) {
      this.expand();
      return;
    }

    this.selectCurrentOption();
    this.collapse()
  }

  onEnterKeyDown = () => {
    if (this.isNeedToExpand) {
      this.expand();
      return;
    }

    this.selectCurrentOption();
    this.collapse()
  }

  onKeyDown = (event) => {
    const { code } = event;

    const action  = {
      ArrowUp: this.onArrowUpKeyDown,
      ArrowDown: this.onArrowDownKeyDown,
      Space: this.onSpaceKeyDown,
      Enter: this.onEnterKeyDown,
     }[code];

    if (action) {
      event.preventDefault();
      action();
    }
  }

  updateTabIndexes(isMobileDevice = MatchMedia.mobile.matches) {
    this.originalControl.tabIndex = isMobileDevice ? 0 : -1;
    this.buttonElement.tabIndex = isMobileDevice ? -1 : 0;
  }

  bindEvents() {
    MatchMedia.mobile.addEventListener('change', this.onMobileMatchMediaChange);
    this.buttonElement.addEventListener('click', this.onButtonClick);
    document.addEventListener('click', this.onClick);
    this.rootElement.addEventListener('keydown', this.onKeyDown);
    this.originalControl.addEventListener('change', this.onOriginalControlChange);
  }
}

class SelectCollection {
  constructor() {
    this.init();
  }

  init() {
    document.querySelectorAll(rootSelector).forEach(((element) => {
      new Select(element);
    }));
  }
}

export default SelectCollection;