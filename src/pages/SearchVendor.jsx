import React, { useState } from 'react';

const VendorSearch = () => {
    const [search, setSearch] = useState('');

    return (
        <div style={{ padding: '20px' }}>
            <h2>Vendor Search</h2>

            <input
                type="text"
                placeholder="Search vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '10px', width: '300px' }}
            />

            <p>Search Query: {search}</p>

            {/* Later: show results here */}
        </div>
    );
};

export default VendorSearch;