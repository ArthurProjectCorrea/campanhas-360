namespace Api.DTOs;

public record ScreenMetadata(
    string Title,
    string Description
);

public record ListResponse<T>(
    ScreenMetadata Screen,
    IEnumerable<T> Data
);
