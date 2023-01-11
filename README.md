# Filters
A screenshot of a dropdown with multiple filter options

![A screenshot of a popover with multiple filter options](filters.png)


## Overview
The Filters component allows users to apply a set of filters to their results. Multiple filter types can be applied within groups using OR boolean logic, and across groups using AND boolean logic. This example is being documented as it provides insight into various React patterns and tradeoffs when building user-facing features.

## Requirements
1. Users should be able to toggle individual filters and dropdowns.
2. Users should be able to toggle an entire group of options.
3. Users should be able to toggle all options in a dropdown.
4. Users should be able to clear all filters.
5. Users should be able to send a link with their applied filters to others. Other users who access that link should see the same filters applied.

## Implementation
For brevity, we will only discuss the implementation of the FiltersProvider file here. This Provider encapsulates most of the business logic that powers the Filters component. The implementation details of the individual Checkbox and Dropdown components and auxiliary helper methods like useQueryParams will not be discussed in full. Some parts of the code have been redacted.


#### 1. Provider pattern:
```
const IncidentFiltersContext = createContext();
```
For this exercise, we use React's provider pattern to help decouple the business logic of manipulating filters from the actual components themself.
We opt for the provider pattern as our state management tool here for the following reasons:
1. It comes natively with React.
2. It is easy to achieve loose coupling with this pattern (Law of Demeter). Only components that are children of the Provider has access to the context. Likewise, it is easy to expose the context to parent components by simply placing the Provider higher up in the hierachy. (What are some downsides of this and how do we mitigate it?)
3. Our team find it much easier to reason with that compared to other libraries like Redux.

While not shown in this exercise, there are pre-defined filters that requires the context of the `FiltersProvider` as well.


#### 2. `useQueryParams` hook.
```
 const [queryParams, setQueryParams] = useQueryParams([
  POLICY_PARAMS_KEY,
  ACTION_PARAMS_KEY,
  USERS_PARAMS_KEY,
  ...
]);

  ...
  
  /**
 * Abstraction to read and set query params from the URL.
 * @param {[]string} keys - Array of query param keys.
 * @returns An object with a key value pair of query params and its values.
 */
export const useQueryParams = (keys = []) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = {};
  keys.forEach(key => {
    const value = searchParams.getAll(key);
    params[key] = value;
  });
  return [params, setSearchParams];
};
```
This helper hook uses the search parameter of the URL as the source of truth for our filters. It behaves similarily to `useState`. It take an array of parameters key as its initial argument. This array is destructed in the hook and used to match for query parameters. The value of query parameters will be the initial state of our filters. Updating the query parameters can be done as follows:

```
 const commitWorkingState = () => {
    setQueryParams({
      [POLICY_PARAMS_KEY]: workingPolicyFilters
        .filter(policy => policy.checked)
        .map(checkedPolicy => checkedPolicy.policyId),
      [ACTION_PARAMS_KEY]: workingRemediationActionsFilters
        .filter(remediationAction => remediationAction.checked)
        .map(
          checkedRemediationAction =>
            checkedRemediationAction.remediationActionType
        ),
      [TAGS_PARAMS_KEY]: workingDetectionTagsFilters
        .filter(tag => tag.checked)
        .map(checkedTags => checkedTags.value),
    ...
```

#### 3. `useQuery` API hooks.
```
const {
  data: policiesData,
  isLoading: arePoliciesLoading,
  error: policiesError
} = usePoliciesFilter();
```
Not all options in the Filters can be determined at compile time (hard-coded). For example, the filter group for policies are sourced by an API call. We use TanStack Query library to fetch and cache filters populated by an API call. The library also provides helpful abstractions like `'isLoading` and `error` which we can use to show intermediate states.
```
export const PoliciesFilterGroup = () => {
  const {
    arePoliciesLoading,
  } = useIncidentFiltersContext();

  if (arePoliciesLoading) {
    return <FilterGroupSkeleton />;
  }
  
return ...
```

### 4. Creating the checked options.
For filters that are sourced from an API, we await for the data to arrive from the API and coalesce this with any initial values from the query parameters. We create an `initPolicies` object that will have a `checked` property to denote if the checkbox is selected or not.
```
  const initPolicies = useMemo(
    () =>
      policiesData?.policies?.map(policy => ({
        policyId: policy?.id ?? '',
        policyName: policy?.name ?? '',
        policyNameKey: policy?.policy_name ?? '',
        policyEnabled: policy?.is_enabled ?? false,
        checked: policyIdsQueryParams.includes(policy?.id ?? '')
      })) ?? [],
    [policiesData?.policies, policyIdsQueryParams]
  );
```

### 5. `useImmer` API hook.
We leverage on the `immer` library to manage the checkbox state. This library provides a good way to draft updates states immutably from the original one.

6. `useEffect` hook.
With..

7. Helper functions.


8. Working state logic.
9. 

## Flowchart

The flowchart below summarizes the logic management for the policies filter. The other filter groups follow a similar pattern.

![A flowchart of the state management of filters](flowchart.png)
