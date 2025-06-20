'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  /* 
  Debouncing is a programming practice that limits the rate at which a function can fire. 
  Query the database when the user has stopped typing.

  In this case, we use a debounce of 500 milliseconds to wait before executing the search function.
  This helps to reduce the number of requests made to the server while the user is typing,
  improving performance and user experience.

  The `useDebouncedCallback` hook from the `use-debounce` library is used to create a debounced version of the search function.
  The `handleSearch` function will only be called after the user has stopped typing for 500 milliseconds. 
  This prevents unnecessary calls to the server for every keystroke, which can be particularly useful in search functionality.

  term is the search term entered by the user.
  The `handleSearch` function updates the search parameters in the URL with the new search term and resets the page to 1.
  */
  const handleSearch = useDebouncedCallback((term) => {
    
    // Update the search params with the new term
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Reset to the first page when the user types a new search query
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query'); // Remove the query parameter if the term is empty
    }
    replace(`${pathname}?${params.toString()}`);
  }, 500);


return (
  <div className="relative flex flex-1 flex-shrink-0">
    <label htmlFor="search" className="sr-only">
      Search
    </label>
    <input
      className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
      placeholder={placeholder}
      onChange={(e) => handleSearch(e.target.value)}
      defaultValue={searchParams.get('query')?.toString()}
    />
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
  </div>
);
}
