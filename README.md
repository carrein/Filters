# Filters
A screenshot of a dropdown with multiple filter options

![A screenshot of a dropdown with multiple filter options](filters.png)


## Overview
The Filters component allows users to apply a set of filters to their results. Multiple filter types can be applied within groups using OR boolean logic, and across groups using AND boolean logic. This example is being documented as it provides insight into various React patterns and tradeoffs when building user-facing features.

## Requirements
1. Users should be able to toggle individual filters and dropdowns.
2. Users should be able to toggle an entire group of options.
3. Users should be able to toggle all options in a dropdown.
4. Users should be able to clear all filters.
5. Users should be able to send a link with their applied filters to others. Other users who access that link should see the same filters applied.

## Implementation
For brevity, we will only discuss the implementation of the FiltersProvider file here. This Provider encapsulates most of the business logic that powers the Filters component. The implementation details of the individual Checkbox and Dropdown components and auxiliary helper methods like useQueryParams will not be discussed in full.
